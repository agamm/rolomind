- I already run the server all the time in the background with `npm run dev`, never run it yourself
- Keep files to less than 200 lines, split to hooks/functions to make everything readable.
- Put components in the right folder or create one for a group of them.
- components/ui is a special dir, don't change it, it is used for shadcn
- NEVER say something works if you didn't check via the browser that it really worked!
- Always remove old unused code/componentes/files that isn't needed anymore.
- Don't add test files unless I ask you to.
- Add --force to npm installs in this project
- Use react-query when querying/fetching http requests
- Don't abstract with too many functions unless it really imroves simplicity and readability.

App functionality:
- Searching "CEOs in Texas" then submitting should show loading (this should always return N>20 results).
- If there are more than 500 contacts it should send chunked requests to query-contacts.
- It should stream contacts as components in the UI, merging them from all chunks.
- It should finish with sending all fund contacts to the generate-summary route to get a summary and then show it in the ui.


Shadcn and designing:
  - Using CSS variables for theming (keeping the existing structure)
  - Minimizing custom CSS classes
  - Relying more on Tailwind utilities
  - Avoiding global style overrides
  - Keeping animations simple and performant
  - Split complex compoennts to sub components in the same component file.