## Development
- Use `npm run tw` to start a tailwind process and have it watch the project for places you add new styles and it will automatically compile it into the output .css for the website
- Use `npm run start` to run the dev server like previously

## Extensions
- EJS Beautify (so we can get some consistent formatting to prevent future commits from being full of indentation and spacing)
- ESLint (to similarly force consistent code style) 

Both of those can be setup to run on save, so ESLint will fix whatever issues it can, and EJS Beautify will format the code in the `.ejs` files to be consistent.

## Routing
- When a "type" of route grows, we can probably move it to its own file in the `routes` directory. This will help keep the `app.ts` file clean and easy to read.