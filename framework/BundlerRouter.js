/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const EventEmitter = require('events');

const captialize = require('titleize');
const router = require('koa-route');

/* eslint-disable class-methods-use-this */
class BundlerRouter extends EventEmitter {
  prepSocketData(data) {
    return JSON.stringify(data);
  }

  static send(socket, data) {
    if (socket.readyState !== 1) {
      return;
    }
    socket.send(data);
  }

  setupRoutes() {
    const { app } = this;
    const events = ['build', 'done', 'invalid', 'progress'];
    const connect = async (ctx) => {
      if (ctx.ws) {
        const socket = await ctx.ws();

        for (const event of events) {
          const handler = this[`socket${captialize(event)}`].bind(this, socket);
          this.on(event, handler);

          socket.on('close', () => {
            this.removeListener(event, handler);
          });
        }

        BundlerRouter.send(socket, this.prepSocketData({ action: 'connected' }));
      }
    };

    app.use(router.get('/wps', connect));
  }

  socketBuild(socket, compilerName = '<unknown>') {
    BundlerRouter.send(socket, this.prepSocketData({ action: 'build', data: { compilerName } }));
  }

  // eslint-disable-next-line no-unused-vars
  socketDone(socket) {
    // ABSTRACT: override in consumer
    BundlerRouter.send(
      socket,
      this.prepSocketData({ action: 'done', data: { warning: 'socketDone should be overridden' } })
    );
  }

  socketInvalid(socket, filePath = '<unknown>') {
    const fileName = filePath.replace(context, '');

    BundlerRouter.send(socket, this.prepSocketData({ action: 'invalid', data: { fileName } }));
  }

  socketProgress(socket, data) {
    BundlerRouter.send(socket, this.prepSocketData({ action: 'progress', data }));
  }
}

module.exports = { BundlerRouter };
