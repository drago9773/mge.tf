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
import { payments } from '../schema.ts';
import dotenv from 'dotenv';

dotenv.config();
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  throw new Error('PayPal client credentials are missing.');
}

const router = express.Router();

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID,
    oAuthClientSecret: PAYPAL_CLIENT_SECRET,
  },
  timeout: 0,
  environment: Environment.Sandbox, // change to `Environment.Production` for production
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});

const ordersController = new OrdersController(client);
router.get("/checkout", (req, res) => {
    res.render("checkout", {
      title: "Checkout",
      session: req.session,
    });
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
    const { cart } = req.body; 
    if (!cart || !Array.isArray(cart)) {
      return res.status(400).json({ error: 'Invalid cart data' });
    }

    const { jsonResponse, httpStatusCode } = await createOrder(cart);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

router.post('/api/orders/:orderID/capture', async (req, res) => {
  try {
    const { orderID } = req.params;
    if (!orderID) {
      return res.status(400).json({ error: 'Missing order ID' });
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

    // Extract amount from captures array
    const amount = purchaseUnits[0].payments.captures[0].amount;
    
    console.log("OrderID: ", orderID);
    console.log("amount.value: ", amount.value);
    console.log("amount.currency_code: ", amount.currency_code);
    console.log("user steam ID: ", userSteamID);

    await db.insert(payments).values({
      paymentId: orderID,
      purchasedFor: userSteamID,
      purchasedBy: userSteamID,
      amount: amount.value,
      currency: amount.currency_code,
      purchaseDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
      description: 'PayPal Order Capture', 
    }); 
    
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    
    // More detailed error logging
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
