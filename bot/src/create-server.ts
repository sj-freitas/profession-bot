/* eslint-disable no-console */
import { createServer } from "http";

export function exposePort(port: string) {
  const server = createServer((_, res) => {
    res.writeHead(204); // 204 No Content
    res.end();
  });

  server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}
