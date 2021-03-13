import type webpack from "webpack";

// @ts-ignore
import { StatsWriterPlugin } from "webpack-stats-plugin";

export class ForgoLazyPlugin {
  apply(compiler: webpack.Compiler) {
    const self = this;

    new StatsWriterPlugin({
      filename: "lazy-stats.json",
      stats: {
        chunkGroups: true,
        publicPath: true,
      },
      transform(data: webpack.StatsCompilation, opts: any) {
        const assetsByChunkName =
          data.namedChunkGroups &&
          Object.keys(data.namedChunkGroups).reduce<{
            [chunk: string]: string[] | undefined;
          }>((p, key) => {
            return {
              ...p,
              [key]: data.namedChunkGroups?.[key].assets?.map(
                (asset) => asset.name
              ),
            };
          }, {});

        const stats = {
          publicPath: data.publicPath,
          assetsByChunkName,
        };

        return JSON.stringify(stats, null, 2);
      },
    }).apply(compiler);
  }
}
