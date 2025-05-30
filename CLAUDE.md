- I already run npm run dev, never run it yourself
- Always test the functionality of the app in the browser before concluding the changes worked and continueing to the next todo.
- Keep files to less than 200 lines, split to hooks/functions to make everything readable.


App functionality:
- Searching "CEOs in Israel" then submitting should show loading (this should always return N>20 results).
- If there are more than 500 contacts it should send chunked requests to query-contacts.
- It should stream contacts as components in the UI, merging them from all chunks.
- It should finish with sending all fund contacts to the generate-summary route to get a summary and then show it in the ui.
