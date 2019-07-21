// NB: issues on travis, run diem locally only!
const gulp = require('gulp');
const { exec } = require('child_process');

gulp.task('nodestart', cb => {
  exec('npm run server', (err, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('nodetest', cb => {
  exec('npm run test', (err, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('hello', () => console.log('Hello gulp'));

gulp.task('default', gulp.parallel(['nodestart', 'nodetest']));
