import express from 'express';
import {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  LogLevel,
  OrdersController,
} from '@paypal/paypal-server-sdk';
import { db } from '../db.ts';
import { payments, teams, divisions, players_in_teams, global } from '../schema.ts';
import dotenv from 'dotenv';
import { and, eq } from 'drizzle-orm';


dotenv.config();
const PAYPAL_CLIENT_ID = 'AbAm_8-1aFq77szD-D9w4Gbq_6F25gMJYTNwSXrC71cHTX3Ps8sK3isXj8qXmXdxmcO813tdPrmFqgw2';
const PAYPAL_CLIENT_SECRET = 'ED5WD0ezPGQf-0HHapbix0fGBNmmINDG3-YnUEK6WSL7WtplMl-PKfg-wURPr3crKRVERJtebD6-VvfV';

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  throw new Error('PayPal client credentials are missing.');
}

const router = express.Router();

const client = new Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_CLIENT_ID,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET,
    },
    environment: Environment.Sandbox,
});

const ordersController = new OrdersController(client);

router.get('/checkout/:teamId', async (req, res) => {
    const userSteamId = req.session?.user?.steamid;
    if (!userSteamId) {
        console.log('No user logged in');
        return res.redirect('/');
    }

    const teamId = parseInt(req.params.teamId);
    if (isNaN(teamId)) {
        console.log('Invalid team ID');
        return res.redirect('/');
    }

    try {
        const team = await db.select()
            .from(teams)
            .where(eq(teams.id, teamId))
            .get();

        if (!team) {
            console.log('Team not found');
            return res.redirect('/');
        }

        const playerTeam = await db.select()
            .from(players_in_teams)
            .where(and(
                eq(players_in_teams.teamId, teamId),
                eq(players_in_teams.playerSteamId, userSteamId),
                eq(players_in_teams.active, 1)
            ))
            .get();

        if (!playerTeam) {
            console.log('User not in team');
            return res.render("layout", {
                body: "checkout",
                title: "Team Payment",
                announcements: [],
                session: req.session,
                team: null,
                division: null,
                error: "You must be a member of this team to make payment"
            });
        }

        const division = await db.select()
            .from(divisions)
            .where(eq(divisions.id, team.divisionId))
            .get();

        if (!division) {
            console.log('Division not found');
            return res.render("layout", {
                body: "checkout",
                title: "Team Payment",
                announcements: [],
                session: req.session,
                team: null,
                division: null,
                error: "Division not found"
            });
        }

        const globalSettings = await db.select().from(global).get();

        res.render("layout", {
            body: "checkout",
            title: "Team Payment",
            announcements: [],
            session: req.session,
            team,
            division,
            error: null
        });
    } catch (error) {
        console.error('Checkout error:', error);
        res.render("layout", {
            body: "checkout",
            title: "Team Payment",
            announcements: [],
            session: req.session,
            team: null,
            division: null,
            error: "Error loading payment information"
        });
    }
});

const createOrder = async (cart: any[]) => {
  const requestBody = {
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          amount: {
            currencyCode: 'USD',
            value: '10.00',
          },
        },
      ],
    },
    prefer: 'return=minimal',
  };

  try {
    const { body, ...httpResponse } = await ordersController.ordersCreate(requestBody);
    return {
      jsonResponse: JSON.parse(body),
      httpStatusCode: httpResponse.statusCode,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`PayPal API error: ${error.message}`);
    }
    throw error;
  }
};

const captureOrder = async (orderID: string) => {
  const requestBody = {
    id: orderID,
    prefer: 'return=minimal',
  };

  try {
    const { body, ...httpResponse } = await ordersController.ordersCapture(requestBody);
    return {
      jsonResponse: JSON.parse(body),
      httpStatusCode: httpResponse.statusCode,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`PayPal API error: ${error.message}`);
    }
    throw error;
  }
};

router.post('/api/orders', async (req, res) => {
  try {
      const { teamId, amount, divisionName } = req.body;
      
      const request = {
          body: {
              intent: "CAPTURE",
              purchaseUnits: [{
                  description: `Division ${divisionName} Registration`,
                  amount: {
                      currencyCode: "USD",
                      value: amount.toString()
                  }
              }]
          }
      };

      const response = await ordersController.ordersCreate(request);
      
      console.log('PayPal Order Created:', response.result.id);
      res.json({ id: response.result.id });
  } catch (error) {
      console.error('Error creating PayPal order:', error);
      console.error('Request failed with:', error.message);
      res.status(500).json({ 
          error: 'Failed to create PayPal order',
          details: error.message 
      });
  }
});

router.post('/api/orders/:orderID/capture', async (req, res) => {
  try {
    const { orderID } = req.params;
    const { teamId } = req.body;

    if (!orderID || !teamId) {
      return res.status(400).json({ error: 'Missing order ID or team ID' });
    }
    
    const userSteamID = req.session.user?.steamid;
    if (!userSteamID) {
      return res.status(400).json({ error: 'User not authenticated' });
    }
    
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);

    console.log("HTTP Status Code:", httpStatusCode);
    console.log("JSON Response:", JSON.stringify(jsonResponse, null, 2));

    const purchaseUnits = jsonResponse.purchase_units;
    if (!purchaseUnits || purchaseUnits.length === 0) {
      return res.status(400).json({ error: 'No purchase units found' });
    }

    const amount = purchaseUnits[0].payments.captures[0].amount;
    
    console.log("OrderID: ", orderID);
    console.log("amount.value: ", amount.value);
    console.log("amount.currency_code: ", amount.currency_code);
    console.log("user steam ID: ", userSteamID);

    await db.update(teams)
      .set({ paymentStatus: 1 })
      .where(eq(teams.id, parseInt(teamId)));

    await db.insert(payments).values({
      paymentId: orderID,
      purchasedFor: userSteamID,
      purchasedBy: userSteamID,
      amount: amount.value,
      currency: amount.currency_code,
      purchaseDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
      description: 'Team Registration Payment',
      teamId: parseInt(teamId)
    }); 
    
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    res.status(500).json({ 
      error: 'Failed to capture PayPal order', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;