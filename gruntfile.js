module.exports = function (grunt) {
    // Load all grunt tasks.
    require('matchdep').filterDev([
        'grunt-*',
        '!grunt-template-*'
    ]).forEach(grunt.loadNpmTasks);
    grunt.loadTasks('tasks');

    grunt.registerTask('default', [
        'browserify',
        'uglify',
        'compress'
    ]);
};
