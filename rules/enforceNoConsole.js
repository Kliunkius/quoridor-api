module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow the use of console.log',
      category: 'Best Practices',
      recommended: true
    },
    schema: []
  },
  create: function (context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'console' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'log'
        ) {
          context.report({
            node,
            message: 'Unexpected console.log() statement.'
          });
        }
      }
    };
  }
};
