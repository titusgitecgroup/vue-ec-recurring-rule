module.exports = {
    css: {
      extract: false,
      loaderOptions: {
        sass: {
          additionalData: ``
        }
      }
    },
    configureWebpack: {
      output: {
        libraryExport: "default",
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            loader: "ts-loader",
            options: {
              appendTsSuffixTo: [/\.vue$/],
            },
            exclude: /node_modules/,
          },
        ],
      },
      resolve: {
        extensions: [".ts", ".js", ".vue", ".json"],
      },
    },
  };