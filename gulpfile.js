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

gulp.task('dbusers', cb => {
  exec('node ./utils/factory/generateUsers.js', (err, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('dbcreate', cb => {
  exec('npx sequelize-cli db:create', (err, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('dbmigrate', cb => {
  exec('npx sequelize-cli db:migrate', (err, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('dbseed', cb => {
  exec('npx sequelize-cli db:seed:all', (err, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('hello', () => console.log('Hello gulp'));

gulp.task('inittest', gulp.series(['dbusers', 'dbmigrate', 'dbseed']));
gulp.task('default', gulp.parallel(['nodestart', 'nodetest']));
