import http from 'request'
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { UserContext } from "../controller/model/UserContext";

export class KudAPI {

    endpoint: string;
    userEmail: string;
    cid: string;
    authorizationHeader: string;

    constructor(userContext: UserContext, execContext: ExecutionContext, authorizationHeader: string) {
        this.endpoint = process.env["KUD_API_ENDPOINT"]!
        this.userEmail = userContext.email
        this.cid = String(execContext.cid);
        this.authorizationHeader = authorizationHeader;
    }

    async getUnreconciledTransaction(): Promise<GetKudTransactionsResponse> {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/transactions?user=${this.userEmail}&paymentsOnly=true&maxResults=1`,
                method: 'GET',
                headers: {
                    'x-correlation-id': this.cid,
                    'Authorization': this.authorizationHeader
                }
            }, (err: any, resp: any, body: any) => {

                if (err) {
                    console.log(err)
                    failure(err);
                }
                else success(JSON.parse(body));

            })
        })
    }
}

export interface GetKudTransactionsResponse {
    payments: KudTransaction[]
}

export interface KudTransaction {
    amount: number,
    date: string,
    id: string,
    kudId: string,
    text: string,
    user: string,
    yearMonth: string
}