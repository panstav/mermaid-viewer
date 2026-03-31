import { MermaidController, urlStorage } from "./MermaidController";

customElements.define("x-mermaid-controller", MermaidController);
const mermaid = document.querySelector("x-mermaid-controller") as MermaidController;
if (!mermaid) {
    throw new Error("Mermaid controller not found");
}

const defaultSequence = `sequenceDiagram
    autonumber
    Alice->>Bob: Hello Bob, how are you ?
    Bob->>Alice: Fine, thank you. And you?
    create participant Carl
    Alice->>Carl: Hi Carl!
    create actor D as Donald
    Carl->>D: Hi!
    destroy Carl
    Alice-xCarl: We are too many
    destroy Bob
    Bob->>Alice: I agree
`;
const initializeMermaid = async () => {
	const url = new URL(window.location.href);
	const mondayItemId = url.searchParams.get("monday_item_id");

	let text: string | null = null;
	let fetchError = false;

	if (mondayItemId) {
		try {
			const response = await fetch(
				`https://hook.eu2.make.com/ph65wvrzq8n7oappn1xilqj0dr2eomco?monday_item_id=${mondayItemId}`
			);
			if (response.ok) {
				const data = await response.json();
				if (data && data.mermaid_code) {
					text = data.mermaid_code;
				} else {
					fetchError = true;
				}
			} else {
				fetchError = true;
				console.error("Webhook returned status:", response.status);
			}
		} catch (error) {
			fetchError = true;
			console.error("Failed to fetch mermaid code from monday_item_id webhook", error);
		}
	}

	if (!text) {
		text = await urlStorage.getText();
	}

	if (text) {
		mermaid.setAttribute("text", text);
	} else {
		if (mondayItemId) {
			const errorText = fetchError
				? "graph TD\n    Error[Error: Failed to fetch from Monday]"
				: "graph TD\n    Empty[No diagram found for this item]";
			mermaid.setAttribute("text", errorText);
		} else {
			mermaid.setAttribute("text", defaultSequence);
			mermaid.setAttribute("dialog-open", "true");
		}
	}
	const sequence = urlStorage.get("sequence-number");
	if (sequence) {
		mermaid.setAttribute("sequence-number", sequence);
	}
};

initializeMermaid();
mermaid.on("textChange", async (event) => {
    await urlStorage.setText(event.detail.text);
});
mermaid.on("sequenceChange", (event) => {
    urlStorage.set("sequence-number", String(event.detail.sequenceNumber));
});
