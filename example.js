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


/*

1. First page will show an input field for an url and submit button
2. After you enter url and click submit button you will see loading 
3. After loading is done you'll see your graph
4. Saving all entered links into database







*/








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