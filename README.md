# Email Template Engine

Nunjucks based templating application developed to quickly create email templates with features like using scss for styling, customizable layouts, dynamic variables and data insertion, live server for development. It also has commands to generate sql queries and run those sql queries in db to either insert or update the generated email templates.

## Initial Setup

After repo is cloned, Run `npm install` to install all the dependencies. \
After that please create a .env file which will hold all the required env variables used to run the application. 
copy all the env variables from example file (env-example) to .env file and set them properly.

## Commands

1. `npm run build` : Used to generate HTML email templates once.
2. `npm run watch` : Used to generate HTML email templates and serve it over a live server.
3. `npm run build-sql-insert` : Used to generate sql insert script for genrated email templates.
4. `npm run build-sql-update` : Used to generate sql update script for genrated email templates.
5. `npm run insert-db` : Used to generate sql insert script and run it for the db details mentioned in .env
6. `npm run update-db` : Used to generate sql update script and run it for the db details mentioned in .env

## config

All the configurable variables are stored in config.js file. \
All the paths used by the applications are configured in config.js. So if you resturcture the folder structure make sure to make respective changes to the config file. \
Before using sql related commands please configure things like table name, column name, sql queries as per your db setup. 


## Further help

Gulp : https://github.com/gulpjs/gulp \
Nunjucks : https://github.com/mozilla/nunjucks \
Scss : https://sass-lang.com/guide/ \
Browser Sync : https://github.com/BrowserSync/browser-sync \
pg: https://node-postgres.com/

