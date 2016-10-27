import { isObject } from "lodash";

export function isPromise( promise ) {
	return isObject( promise ) &&
		promise.then instanceof Function &&
		promise.catch instanceof Function;
}
