const logs = [];
const logger = {
    log: (...args) => {
        logs.push(args.map(a => String(a)).join(' '));
        console.log.apply(console, args);
    }
};

module.exports = logger;