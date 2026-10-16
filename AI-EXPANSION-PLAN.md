# More pictures, questions, hints and answers

## What works in this package

On the Theme 1 pilot, signed-in students can separately request **Generate hints** and **Generate model answer** for the selected question. The selected picture and question format are sent to the server. Generated results are drafts and remain separate from the reference answer. They are not automatically published or saved as approved content.

The original uploaded website already had a model-generation function, but its prompt used the old structures and wording. The pilot adds an isolated generator following the reviewed structures; it does not replace the generator on other themes.

## More pictures and questions for each theme

Yes, this is feasible, but it is not implemented by the current uploaded website or by this pilot. It needs a parent-controlled creation workflow rather than an unrestricted student image button.

Proposed controls in each theme:

1. **Create picture** — choose or describe a related public-space situation. The parent sees the image before using it.
2. **Generate questions** — after selecting a picture, generate draft questions by format. Keep the core theme at 6–9; additional material stays in a reserve bank.
3. **Generate hints** — produce three short, answer-relevant cues; experience questions use story-building prompts.
4. **Generate model answer** — generate the selected question's complete answer in the approved format, using the actual selected image for picture questions.
5. **Review and approve** — edit drafts, approve selected items, then publish a reviewed batch. An approved answer must never be replaced by a later AI draft.

A new picture should not imply that every question needs generating again. Existing experience and discussion questions may be reused where relevant.

## Implementation still required for image and question creation

- Parent-role authorization, verified on the server, for paid picture and question generation and publishing.
- An image-generation endpoint or asynchronous job, because image generation can take longer than a synchronous web request. Check the Netlify plan's function/background limits before choosing the job architecture.
- Server-side OpenAI image-generation access, with a configurable supported model. Keep the key out of the browser.
- A private draft store and image storage with policies enforcing family/parent ownership.
- A question generator that receives the actual image, not only the scene prompt; visible evidence must be checked before approval.
- Stable picture IDs, question IDs and content versions so history stays attached to the question actually attempted.
- Separate generation status and approval status. Regeneration creates a new draft version and never overwrites approved content.
- Separate parent spending/usage limits for image jobs and question generation. The pilot's shared student text allowance is not an image budget.
- Review screens showing picture, question, hints and answer together, plus a clear deliberate publish action.

Do this as the next feature batch after the Theme 1 pilot has been tested. Do not expose a placeholder button that looks functional but has no server workflow behind it.
