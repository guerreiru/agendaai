export function highlight(text: string, query: string) {
	if (!query) return text;

	const parts = text.split(new RegExp(`(${query})`, "gi"));
	let cursor = 0;

	return parts.map((part) => {
		const start = cursor;
		cursor += part.length;

		return part.toLowerCase() === query.toLowerCase() ? (
			<span key={`${part}-${start}`} className="bg-yellow-200 rounded px-0.5">
				{part}
			</span>
		) : (
			part
		);
	});
}
