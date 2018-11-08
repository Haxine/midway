'use strict';

import loadSchedule from './load_schedule';
const BaseSchedule = require('egg-schedule/lib/schedule');

const M_STRATEGY: string = Symbol('strategy') as any;
const M_STRATEGY_INSTANCE: string = Symbol('strategy_instance') as any;

module.exports = class Schedule extends BaseSchedule {
  constructor(agent) {
    super(agent);
    this[M_STRATEGY] = new Map();
    this[M_STRATEGY_INSTANCE] = new Map();
  }

  /**
   * register a custom Schedule Strategy
   * @param {String} type - strategy type
   * @param {Strategy} clz - Strategy class
   */
  use(type, clz) {
    super.use(type, clz);
    this[M_STRATEGY].set(type, clz);
  }

  init() {
    // load egg-schedule (inside 'app/schedule')
    super.init();
    // load midway-schedule (inside 'lib/schedule')
    this.loadSchedule();
  }

  loadSchedule() {
    const scheduleItems = loadSchedule(this.agent);

    for (const k of Object.keys(scheduleItems)) {
      const { key, schedule } = scheduleItems[k];
      const type = schedule.type;
      if (schedule.disable) continue;

      const Strategy = this[M_STRATEGY].get(type);
      if (!Strategy) {
        const err = new Error(`schedule type [${type}] is not defined`);
        err.name = 'EggScheduleError';
        throw err;
      }

      const instance = new Strategy(schedule, this.agent, key);
      this[M_STRATEGY_INSTANCE].set(key, instance);
    }
  }

  start() {
    // start egg-schedule
    super.start();
    // start midway-schedule
    for (const instance of this[M_STRATEGY_INSTANCE].values()) {
      instance.start();
    }
  }
};