import http from 'request'
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { UserContext } from "../controller/model/UserContext";
import { TotoExpense } from './ExpensesAPI';

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

    /**
     * Retrieves the next unreconciled transaction
     * @param skipTransactions number of transactions to skip
     * @returns 
     */
    async getUnreconciledTransaction(skipTransactions: number): Promise<GetKudTransactionsResponse> {

        // Calculate the number of transactions to extract
        // The number depends from skipTransactions: if skipTransactions > 0, then retrieve (1 + skipTransactions) transactions
        const maxResults = skipTransactions + 1

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/transactions?user=${this.userEmail}&paymentsOnly=true&maxResults=${maxResults}`,
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

    /**
     * Counts the kud transactions (total, not just the non-reconciled)
     * @returns Promise<CountKudTransactionsResponse> the count
     */
    async countKudTransactions(): Promise<CountKudTransactionsResponse> {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/transactions/count?user=${this.userEmail}`,
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

    async postReconciliation(kudTransaction: KudTransaction, totoExpense: TotoExpense) {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/reconciliations`,
                method: 'POST',
                headers: {
                    'x-correlation-id': this.cid,
                    'Authorization': this.authorizationHeader,
                    'Content-Type' : "application/json",
                }, 
                body: JSON.stringify({
                    kudPayment: kudTransaction, 
                    totoTransaction: totoExpense
                })
            }, (err: any, resp: any, body: any) => {

                if (err) {
                    console.log(err)
                    failure(err);
                }
                else success(JSON.parse(body));

            })
        })

    }

    /**
     * Counts the reconciliations
     * @returns Promise<CountReconciliationsResponse> the count
     */
    async countReconciliations(): Promise<CountReconciliationsResponse> {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/reconciliations/count?user=${this.userEmail}`,
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

export interface CountKudTransactionsResponse {
    count: number
}
export interface CountReconciliationsResponse {
    reconciliationCount: number
}