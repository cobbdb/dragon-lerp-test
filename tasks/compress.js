module.exports = function (grunt) {
    grunt.config.merge({
        compress: {
            build: {
                options: {
                    archive: 'app.zip'
                },
                src: [
                    'assets/**',
                    'dist/**',
                    'index.html'
                ]
            }
        }
    });
};
