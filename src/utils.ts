export function arrToReadableList(arr: string[]): string {
	const last = arr.pop();
	return `${arr.join(', ')}, and ${last}`;
}
