module.exports = function (grunt) {
    grunt.config.merge({
        browserify: {
            build: {
                files: {
                    'dist/lerp-test.js': [
                        'src/*.js'
                    ]
                }
            }
        }
    });
};
