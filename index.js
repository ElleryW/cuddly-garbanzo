const JSSoup = require("jssoup").default;
const axios = require("axios");

const args = process.argv.slice(2);
const host = args[0];
const searchTerm = args[1];
const crawledLinks = [];
const termLinks = [];
const depth = args[2] || 2;

// Get some inputs
if (!host || !searchTerm) {
  console.error("Missing argument");
  process.exit(1);
}

const getPage = async (path) => {
  // Don't parse a link we already parsed as a descendent of another page
  if (crawledLinks.includes(path)) return null;
  // Track link
  crawledLinks.push(path);

  try {
    console.log(`Crawling page: ${host}${path}`);
    const response = await axios.get(`${host}${path}`);
    return response.data;
  } catch (error) {
    //console.error(error);
  }
};

const findSearchTerm = (soup, path) => {
  const text = soup.text;
  if (text.indexOf(searchTerm) > -1) {
    termLinks.push(path);
  }
};

const parseLinks = (soup) => {
  const links = soup.findAll("a").map((x) => x.attrs.href);
  const filteredLinks = [];
  links.forEach((x) => {
    if (
      x &&
      // Ditch anchor links
      x.indexOf("#") === -1 &&
      // skip anything with a full path as we only want relative links
      x.indexOf("://") === -1 &&
      // Remove duplicates
      !filteredLinks.includes(x)
    )
      filteredLinks.push(x);
  });
  return filteredLinks;
};

const search = async (path, currentDepth) => {
  if (currentDepth > depth) return;

  const html = await getPage(path); //.then((html) => {
  if (!html) return;
  const soup = new JSSoup(html);
  findSearchTerm(soup, path);
  const links = parseLinks(soup);
  for (const link of links) {
    await search(link, currentDepth + 1);
  }
};

// Start with root path
search("/", 0).then((data) => {
  console.log(
    `Crawled ${crawledLinks.length} pages and found search term '${termLinks.length}' times on the following pages:`
  );
  console.log(termLinks);
});
