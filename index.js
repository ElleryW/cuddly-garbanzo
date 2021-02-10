const JSSoup = require("jssoup").default;
const axios = require("axios");

const args = process.argv.slice(2);
// FIXME - kill hard coded values
const host = args[0] || "https://www.apple.com";
const searchTerm = args[1] || "apple";
const parsedLinks = [];
let pagesCrawled = 0;

if (!host || !searchTerm) {
  console.error("Missing argument");
  process.exit(1);
}

const getPage = async (path) => {
  // Don't parse a link we already parsed as a descendent of another page
  if (parsedLinks.includes(path)) return null;
  // Track link
  parsedLinks.push(path);
  pagesCrawled++;

  const response = await axios.get(`${host}/${path}`);
  return response.data;
};

getPage("/").then((data) => {
  const soup = new JSSoup(data);
  const text = soup.text;
  if (text.indexOf(searchTerm) > -1) console.log(text);
  const links = soup.findAll("a").map((x) => x.attrs.href);
  const filteredLinks = [];
  links.forEach((x) => {
    // Ditch anchor links and remove duplicates
    if (x.indexOf("#") === -1 && !filteredLinks.includes(x))
      filteredLinks.push(x);
  });
  console.log(filteredLinks);
});
