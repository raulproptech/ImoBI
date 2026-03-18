// Type augmentation for fastify-plugin (fp)
declare module 'fastify-plugin' {
  import type { FastifyPluginAsync, FastifyPluginCallback } from 'fastify'
  function fp<T>(
    fn: FastifyPluginAsync<T> | FastifyPluginCallback<T>,
    options?: object
  ): FastifyPluginAsync<T> | FastifyPluginCallback<T>
  export = fp
}
