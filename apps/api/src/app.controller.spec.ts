import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  it('returns an application health status', () => {
    const controller = new AppController(new AppService());

    expect(controller.health()).toEqual({ status: 'ok' });
  });
});
