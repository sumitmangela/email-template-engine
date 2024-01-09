require('dotenv').config()
const config = require('./config.js');

const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const replace = require('gulp-replace');
const inlineCss = require('gulp-inline-css');
const data = require('gulp-data');
const nunjucksRender = require('gulp-nunjucks-render');
const browserSync = require('browser-sync').create();
const header = require('gulp-header');
const footer = require('gulp-footer');
const concat = require('gulp-concat');
const flatmap = require('gulp-flatmap');
const pluginError = require('plugin-error');
const { Client } = require('pg');
const fs = require('node:fs');

/* compile email files */

const CompileFiles = (path) =>{
  const date = new Date()

  // Gets .html and .nunjucks files in pages
  return gulp.src(config.email_path)

  // Adding data to nunjucks
  .pipe(data(function() {
    return require(config.data_path)
  }))

  // Renders template with nunjucks
  .pipe(nunjucksRender({
    path: [config.template_path],
    envOptions: config.nunjucks_config
  }))

  // replace single quote to escape character
  .pipe(replace(new RegExp('\'', 'g'), '&#39;'))

   // replace `.scss` file paths from template with compiled file paths
   .pipe(replace(new RegExp('\/scss\/(.+)\.scss', 'ig'), '/css/$1.css'))

   // inline CSS
   .pipe(inlineCss())
  // output files in app folder
 
  .pipe(header('<!-- ${filename}:'+date.toISOString().slice(0, 16)+' -->\n'))
  .pipe(gulp.dest(path))
}


/* build email files */

gulp.task('compileScss', function () { // compile sass to css
  return gulp
      // import all email .scss files from src/scss folder
      // ** means any sub or deep-sub files or folders
      .src(config.scss_path)

      // on error, do not break the process
      .pipe(sass().on('error', sass.logError))

      // output to `src/css` folder
      .pipe(gulp.dest(config.css_path));
});

gulp.task('build', gulp.series( 'compileScss',  function(){
 return CompileFiles(config.dist_path)
})); 


/* watch email files */

gulp.task('build-watch', gulp.series( 'compileScss',  function(){
  return CompileFiles(config.dist_watch_path)
}));

gulp.task('browserSync', function (done) { // browserSync task to launch preview server
  browserSync.init({
      reloadDelay: 20, // reload after 2ms, compilation is finished
      server: { 
        baseDir: config.dist_watch_path,
        directory: true,
        ui: false
      }
  });
  done();
});

gulp.task('reloadBrowserSync', function (done) { // task to reload browserSync
  browserSync.reload();
  done();
});


gulp.task('watch', gulp.series('build-watch', 'browserSync', function () {
  gulp.watch([
        config.watch_path,
        config.dont_watch_path,
    ], gulp.series('build-watch', 'reloadBrowserSync'));
}));


/* build sql file and execute queries */

const CompileSqlInsert = (src_path, dest_path, sqlFilename) =>{
  // Gets .html files from dist
  return gulp.src(src_path)
  .pipe(flatmap((stream, file) => {
    //get filename
    const filename = file.path.replace(/^.*[\\/]/, '').replace(/\.[^/.]+$/, "");
    return stream 

    // create sql command
    .pipe(header(ReplaceValues(config.insert_query_start, {filename:filename})))
    .pipe(footer(config.insert_query_end));
  }))

  // output sql command in sql file
  .pipe(concat(sqlFilename))
 
  .pipe(gulp.dest(dest_path))
}

const CompileSqlUpdate = (src_path, dest_path, sqlFilename) =>{
  // Gets .html files from dist
  return gulp.src(src_path)
  .pipe(flatmap((stream, file) => {
    //get filename
    const filename = file.path.replace(/^.*[\\/]/, '').replace(/\.[^/.]+$/, "");
    return stream 

    // create sql command
    .pipe(header(config.update_query_start))
    .pipe(footer(ReplaceValues(config.update_query_end, {filename:filename})));
  }))

  // output sql command in sql file
  .pipe(concat(sqlFilename))
 
  .pipe(gulp.dest(dest_path))
}

const RunSqlDB = async (dest_path, sqlFilename) =>{
  const filePath = dest_path + sqlFilename;
  try {
    const query = fs.readFileSync(filePath, 'utf8'); //get file content
    await RunQuery(query).catch(console.error)
  } catch (err) {
    throwError('sql file', 'Error while reading the sql file at path:'+filePath)
  }
}

const RunQuery = async(query) => {
  /* connect to db and execute query */
  const client = new Client(
    {
      host: process.env.PGHOST,
      user: process.env.PGUSER,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT,
    }
  )
    await client.connect()
    const res = await client.query(query)
    console.log('query executed:', res)
    await client.end()
}


const GetSqlFileName = (insert=true,single_template = null) =>{
  const date = new Date()
  const sqlFilename = 'sqlQueryFile_'+ (insert ? 'Insert':'Update') + (single_template ? '_'+single_template : '') +
  '_'+date.toISOString().slice(0, 10)+'.sql';
  return sqlFilename;
}

const ReplaceValues = (string, values) => {
  Object.keys(values).forEach(x=>{
    string = string.replace(`({{ ${x} }})`, values[x]);
  })
  return string
}

function throwError(plugin, message)  {
  var err = new pluginError(
    {
      plugin: plugin,
      message: message
    });
  throw Error(err);
}

gulp.task('build-sql-insert', async function(){
  if(config.single_template_sql){
    return CompileSqlInsert(config.dist_path+'/'+ config.single_template_sql, config.dist_path_sql, GetSqlFileName(true))
  }
  else{
    return CompileSqlInsert(config.dist_path, config.dist_path_sql, GetSqlFileName(true))
  }
});

gulp.task('build-sql-update', async function(){
  if(config.single_template_sql){
    return CompileSqlUpdate(config.dist_path+'/'+ config.single_template_sql, config.dist_path_sql, GetSqlFileName(false))
  }
  return CompileSqlUpdate(config.dist_path, config.dist_path_sql, GetSqlFileName(false))
});


gulp.task('insert-db', gulp.series('build-sql-insert', async function (done) {
  await RunSqlDB(config.dist_path_sql, GetSqlFileName(true))
  done();
}));

gulp.task('update-db', gulp.series('build-sql-update', async function (done) {
  await RunSqlDB(config.dist_path_sql, GetSqlFileName(false))
  done();
}));

