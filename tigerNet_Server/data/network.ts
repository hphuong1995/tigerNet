import { Connector } from "./connector";
import { Domain } from "./domain";
export class Network {
    public domainConnections: Connector[];
    public domains: Domain[];
    constructor(domains: Domain[], domainConnections: Connector[]) {
        this.domains = domains;
        this.domainConnections = domainConnections;
    }

    public getDomainById(id: string): Domain {
        return this.domains.find((d) => d.id === id);
    }
}