const logs = [];
const logger = {
    log(...args) {
        logs.push(args.map(a => String(a)).join(' '));
        console.log.apply(console, args);
    },
    getLogs() {
        return logs;
    }
};

module.exports = logger;