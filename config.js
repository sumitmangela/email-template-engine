require('dotenv').config()

/* update table details as per your db setup */
const table_name = 'emails';
const compare_column_name = 'email_name';
const data_column_name = 'email_template';
const db_table_name = process.env.PGSCHEMA && process.env.PGSCHEMA + table_name || table_name;

/* Update sql queries here based on your db setup, default sql queries assume that email file name will be used compare table column value */

const insert_query_start = `INSERT INTO ${db_table_name} (${data_column_name}, ${compare_column_name}) \n VALUES ('({{ filename }})', '`;
const insert_query_end = `'); \n\n`;
const update_query_start = `UPDATE ${db_table_name} \n SET ${data_column_name}='`;
const update_query_end = `' \n WHERE ${compare_column_name} = '({{ filename }})'; \n\n`;

const config_export = {
  email_path: `./src/emails/**/*.+(html|njk)`,
  template_path: `./src/templates/`,
  scss_path: `./src/scss/**/*.scss`,
  css_path: `./src/css`,
  data_path: `./src/data.json`,

  watch_path: `./src/**/*`,
  dont_watch_path: `!src/**/*.css*`,

  dist_path: `./dist/emails/`,
  dist_watch_path: `./dist/emails/`,

  //nunjucks config
  nunjucks_config: {
    tags: {
      variableStart: '${',
      variableEnd: '}'
    }
  },

  //sql config
  html_path_sql: `./dist/emails/*.html`,
  dist_path_sql: `./dist/sql/`,
  insert_query_start: insert_query_start,
  insert_query_end: insert_query_end,
  update_query_start: update_query_start,
  update_query_end: update_query_end,

  //sql single
  single_template_sql: process.env.SINGLE_TEMPLATE_SQL || '', //template name which will be used for single build and update commands, e.g, Provisioning_User.html
}

module.exports = config_export