module.exports = function (grunt) {
    grunt.config.merge({
        uglify: {
            build: {
                files: {
                    'dist/lerp-test.min.js': [
                        'dist/lerp-test.js'
                    ]
                }
            }
        }
    });
};
