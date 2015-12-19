import gulp from 'gulp';
import sass from 'gulp-sass';
import markdown from 'gulp-markdown';
import connect from 'gulp-connect';
import mergeStream from 'merge-stream';
import frontMatter from 'gulp-front-matter';
import es from 'event-stream';
import jade from 'jade';
import browserSyncModule from 'browser-sync';
import ghPages from 'gulp-gh-pages';

const browserSync = browserSyncModule.create();

function browserSyncStart() {
    browserSync.init({
        server: 'build',
        directory: true,
        ghostMode: false
    });
}


gulp.task('deploy', ['build'], () => {
    return gulp.src('build/**/*').pipe(ghPages({
        branch: 'master'
    }));
});

gulp.task('build', () => outputStream().pipe(gulp.dest('build')));

gulp.task('rebuild', ['build'], browserSync.reload);

gulp.task('watch', ['rebuild'], () => {
    gulp.watch('src/**/*', ['build']);
});

gulp.task('serve', browserSyncStart);

gulp.task('dev', ['serve', 'watch']);

function getTemplate(name) {
    return jade.compileFile('src/templates/' + name + '.jade');
}

function applyTemplate(file, cb) {
    const templateName = file.data.template || 'default';
    const template = getTemplate(templateName);
    file.contents = new Buffer(template({
        content: file.contents.toString(),
        data: file.data
    }));
    cb(null, file);
}

function outputStream() {
    const styles =  gulp.src('src/styles/main.scss')
        .pipe(sass({outputStyle: 'compressed'}));

    const content = gulp.src('src/content/**/*.md')
        .pipe(frontMatter({
            property: 'data',
            remove: true
        }))
        .pipe(markdown())
        .pipe(es.map(applyTemplate));

    const other = gulp.src('src/static/**/*');

    return mergeStream(styles, content, other);
}
