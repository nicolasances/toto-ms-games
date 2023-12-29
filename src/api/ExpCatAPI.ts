import http from 'request'
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { UserContext } from "toto-api-controller/dist/model/UserContext";

export class ExpCatAPI {

    endpoint: string;
    userEmail: string;
    cid: string;
    authorizationHeader: string;

    constructor(userContext: UserContext, execContext: ExecutionContext, authorizationHeader: string) {
        this.endpoint = process.env["EPXCAT_API_ENDPOINT"]!
        this.userEmail = userContext.email
        this.cid = String(execContext.cid);
        this.authorizationHeader = authorizationHeader;
    }

    /**
     * Predicts a category using the ExpCat Model API
     * 
     * @param desc the description of the payment
     * @returns the prediction
     */
    async predictCategory(desc: string): Promise<ExpcatPrediction> {

        return new Promise((success, failure) => {

            http({
                uri: `${this.endpoint}/predict?description=${desc}&email=${this.userEmail}`,
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

export interface ExpcatPrediction {

    prediction: string[]

}