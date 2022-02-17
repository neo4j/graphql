// eslint-disable-next-line import/no-extraneous-dependencies
const NodeEnvironment = require('jest-environment-node');

class CustomTestEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
    console.log(config)
    this.intTestDbName = config.globals.intTestDbName
    // this.testPath = context.testPath;
    // this.docblockPragmas = context.docblockPragmas;
  }


  // SEE: https://jestjs.io/docs/configuration#globalsetup-string

  async setup() {
    await super.setup();
    console.log('testtttt', this.intTestDbName)
    this.global.intTestDbName = 'TEEEE'
  }

  async teardown() {
    await super.teardown();
  }
}

module.exports = CustomTestEnvironment;