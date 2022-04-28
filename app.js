const http = require("http");
const https = require("https");
const PORT = process.env.PORT || 5000;

function getTimeStories(url, resolve, reject) {
  https.get(url, (res) => {
    // if any other status codes are returned, those needed to be added here
    if (res.statusCode === 301 || res.statusCode === 302) {
      return getTimeStories(res.headers.location, resolve, reject);
    }

    let body = [];

    res.on("data", (chunk) => {
      body.push(chunk);
    });

    res.on("end", () => {
      try {
        resolve(Buffer.concat(body).toString());
      } catch (err) {
        reject(err);
      }
    });
  });
}

function getHeadlinesAndLinks(body) {
  const headlinesAndLinks = body.match(
    /<a href="\/.*\/">\s*<h3 class="latest-stories__item-headline">.*<\/h3>/g
  );

  let links = [];
  headlinesAndLinks.map((headlineAndLink) => {
    links.push(headlineAndLink.match(/\/\d+\/.+\//g));
  });

  let headlines = [];
  headlinesAndLinks.map((headlineAndLink) => {
    let match = headlineAndLink.match(/>.+<\/h3>/g)[0];

    headlines.push(
      match.slice(1, match.length - 5).replaceAll(/(<([^>]+)>)/gi, "")
    );
  });

  let data = [];
  for (let i = 0; i < 6; ++i) {
    data.push({
      title: headlines[i],
      link: "https://time.com" + links[i][0],
    });
  }

  return data;
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/getTimeStories" && req.method === "GET") {
    new Promise((resolve, reject) =>
      getTimeStories("https://www.time.com", resolve, reject)
    ).then((response) => {
      const data = getHeadlinesAndLinks(response);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.write(JSON.stringify(data));
      res.end();
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
