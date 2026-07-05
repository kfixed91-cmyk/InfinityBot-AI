class Plugin {
    constructor(client, database) {
        this.client = client;
        this.database = database;
        this.name = 'Base Plugin';
        this.version = '1.0.0';
        this.description = 'Plugin debaz';
        this.commands = [];
    }
}

module.exports = Plugin;
