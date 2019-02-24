import resolver from "./address-resolver";

export default function parse (address) {
	return resolver.queryAddress(address);
}