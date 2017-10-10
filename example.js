// {
//     "url": { 
//         "url1": {}
//         "url2": null
//      }
// }

// {
//     "url": children
// }

// {
//     "name": url,
//     "children": children
// };

function transformApiTreeToD3Tree(apiTree) {

  function transform(name, treeNode) {
    if (!treeNode) return { name };
  
    const entries = Object.entries(treeNode);
    return {
      name,
      children: entries.map(([key, value]) => transform(key, value)),
    };
  }
  
  const [key, value] = Object.entries(apiTree)[0]
  return transform(key, value)
}