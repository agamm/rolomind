- I already run npm run dev, never run it yourself
- Always test the functionality of the app in the browser before concluding the changes worked and continueing to the next todo.
- Keep files to less than 200 lines, split to hooks/functions to make everything readable.
- Put components in the right folder or create one for a group of them.
- components/ui is a special dir, don't change it, it is used for shadcn
- NEVER say something works if you didn't check via the browser that it really worked!
- Always remove old unused code/componentes/files that isn't needed anymore.

App functionality:
- Searching "CEOs in Israel" then submitting should show loading (this should always return N>20 results).
- If there are more than 500 contacts it should send chunked requests to query-contacts.
- It should stream contacts as components in the UI, merging them from all chunks.
- It should finish with sending all fund contacts to the generate-summary route to get a summary and then show it in the ui.