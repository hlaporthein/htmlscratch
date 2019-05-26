// Defining requirements
var gulp = require( 'gulp' );
var gulpif = require('gulp-if');

var plumber = require( 'gulp-plumber' );
var sass = require( 'gulp-sass' );
var watch = require( 'gulp-watch' );

var concat = require( 'gulp-concat' );
var uglify = require( 'gulp-uglify' );
var streamqueue = require('streamqueue');

var sourcemaps = require( 'gulp-sourcemaps' );
var browserSync = require( 'browser-sync' ).create();
var del = require( 'del' );
var cleanCSS = require( 'gulp-clean-css' );
var autoprefixer = require( 'gulp-autoprefixer' );

// Configuration file to keep your code DRY
var cfg = require( './gulpconfig.json' );
var paths = cfg.paths;

function cp_watch_helper_css_js(enviroment = pro, reload=true) {

     var runCount = 1;

    gulp.watch( paths.assets + '/css/*.css',    gulp.parallel( enviroment + '-style') );
    gulp.watch( paths.scss + '/*.scss', gulp.series( enviroment + '-style') );
    gulp.watch( paths.assets + '/js/*.js', gulp.series( enviroment + '-script') );
    if ( reload == true ) {
        browserSync.reload();
    }

    if ( runCount == 1 ) {
        cp_style_export_helper(enviroment);
        cp_js_helper_export(enviroment)
        runCount = +1;
    }
}

function cp_css_dev_helper(sources,output = 'pro', filename, source_maps = true) {

    var stream = sources
        .pipe( sourcemaps.init( { loadMaps: true } ) )
        .pipe(autoprefixer({ browsers: ['last 30 versions'],cascade: false}))
        .pipe( gulpif(output == 'pro', cleanCSS( { compatibility: '*' } )) )
        .pipe( plumber( {
            errorHandler: function( err ) {
                console.log( err );
                this.emit( 'end' );
            }
        } ) )
        .pipe(concat(filename))
        .pipe( gulpif(source_maps == true, sourcemaps.write( paths.dist + '/css' )) )
        .pipe( gulp.dest( paths.dist + '/css' ) );

    return stream;
}

function cp_style_export_helper(enviroment) {

    var sass_output_name = 'sass-output.css';
    var normal_css_output_name = 'normal-style-output.css';
    var compile_css_file_name = 'style.css';

    if ( enviroment === 'pro' ) {

        sass_output_name = 'sass-output.min.css';
        normal_css_output_name = 'normal-style-output.min.css';
        compile_css_file_name = 'style.min.css';

    }

    var stream = streamqueue({ objectMode: true },
        gulp.src(paths.wp_stylesheet),
        cp_css_dev_helper(gulp.src( paths.scss + '/*.scss' ).pipe( sass( { errLogToConsole: true } ) ), enviroment, sass_output_name, false),
        cp_css_dev_helper(gulp.src( paths.normal_css_file_list ), enviroment,  normal_css_output_name, false)
    )
    .pipe(concat(compile_css_file_name))
        .pipe( sourcemaps.write( '.' ) )
    .pipe( gulp.dest( paths.dist + '/css' ) );

    return stream;

}


function cp_js_helper_export(enviroment){

    if ( enviroment !== 'pro' ) {

        var stream = gulp.src( paths.js_file_list )
            .pipe( concat( 'script.js' ) )
            .pipe( gulp.dest( paths.js ) );

    } else {

        var stream = gulp.src( paths.js_file_list )
            .pipe( concat( 'script.min.js' ) )
            .pipe( uglify() )
            .pipe( gulp.dest( paths.dist + '/js' ) );

    }

    return stream;

}


gulp.task('pro-style', function(){
    return cp_style_export_helper('pro');
});

gulp.task('dev-style', function(){
    return cp_style_export_helper('dev');
});

gulp.task('dev-normal-css', function(){
    var stream = cp_css_dev_helper(gulp.src( paths.normal_css_file_list ), 'dev',  'normal.css');
    return stream;
});

gulp.task('pro-normal-css', function(){
    var stream = cp_css_dev_helper(gulp.src( paths.normal_css_file_list ), 'pro',  'normal.min.css');
    return stream;
});

gulp.task('dev-sass', function(){
    var stream = cp_css_dev_helper(gulp.src( paths.scss + '/*.scss' ).pipe( sass( { errLogToConsole: true } ) ), 'dev', 'sass-output.css');
    return stream;
});

gulp.task('pro-sass', function(){
    var stream = cp_css_dev_helper(gulp.src( paths.scss + '/*.scss' ).pipe( sass( { errLogToConsole: true } ) ), 'pro', 'sass-output.min.css');
    return stream;
});


gulp.task('dev-script', function(){
    return cp_js_helper_export('dev');
});

gulp.task('pro-script', function(){
    return cp_js_helper_export('pro');
});



gulp.task('pro-watch', function(done){
    del(['./style.css', './style.css.map', cfg.paths.dist + '/css/*', cfg.paths.dist + '/js/*']);
    cp_watch_helper_css_js('pro', true);
    browserSync.reload();
    done();
});

gulp.task( 'dev-watch', function(done) {
    cp_watch_helper_css_js('dev', true);
    browserSync.reload();
    done();
});

gulp.task( 'dev-justwatch', function(done) {
    cp_watch_helper_css_js('dev', false);
    done();
});

gulp.task( 'browser-sync', function(done) {
    browserSync.init( cfg.browserSyncWatchFiles, cfg.browserSyncOptions );
    done();
} );

gulp.task( 'dev', gulp.series('browser-sync', 'dev-watch'));
gulp.task( 'pro', gulp.series( 'pro-watch'));