(function () {
  "use strict";

  var catalog = [
    {
      id: "sorting_selection",
      title: "Selection Sort",
      group: "Sorting",
      description: "给定一组整数，演示每轮从未排序区间中选择最小值并放到前面。",
      template: "CPP-DSA/visual_main_templates/sorting_selection_main.cpp",
      fields: [
        {
          name: "values",
          label: "待排序数字",
          type: "int-list",
          placeholder: "7 2 6 3 1 5 4",
          defaultValue: "7 2 6 3 1 5 4",
          help: "适合用 5 到 9 个数字观察每一轮选择。"
        }
      ]
    },
    {
      id: "sorting_bubble",
      title: "Bubble Sort",
      group: "Sorting",
      description: "给定一组整数，演示相邻逆序对交换，以及一轮无交换时提前结束。",
      template: "CPP-DSA/visual_main_templates/sorting_bubble_main.cpp",
      fields: [
        {
          name: "values",
          label: "待排序数字",
          type: "int-list",
          placeholder: "5 1 4 2 8 3",
          defaultValue: "5 1 4 2 8 3",
          help: "数字越多交换越密集，教学演示推荐 5 到 8 个。"
        }
      ]
    },
    {
      id: "sorting_insertion",
      title: "Insertion Sort",
      group: "Sorting",
      description: "给定一组整数，演示把当前元素插入到前方有序区的过程。",
      template: "CPP-DSA/visual_main_templates/sorting_insertion_main.cpp",
      fields: [
        {
          name: "values",
          label: "待排序数字",
          type: "int-list",
          placeholder: "6 2 5 1 4 3",
          defaultValue: "6 2 5 1 4 3",
          help: "可以用近乎有序的数组观察插入排序的优势。"
        }
      ]
    },
    {
      id: "sorting_quick",
      title: "QuickSort",
      group: "Sorting",
      description: "给定一组整数，演示快速排序的分区和递归过程。",
      template: "CPP-DSA/visual_main_templates/sorting_quick_main.cpp",
      fields: [
        {
          name: "values",
          label: "待排序数字",
          type: "int-list",
          placeholder: "7 2 6 3 1 5 4",
          defaultValue: "7 2 6 3 1 5 4",
          help: "输入空格、逗号或换行分隔的整数。建议 5 到 12 个数字。"
        }
      ]
    },
    {
      id: "sorting_heap",
      title: "Heap Sort",
      group: "Sorting",
      description: "给定一组整数，演示建最大堆、交换堆顶到尾部、再下沉调整。",
      template: "CPP-DSA/visual_main_templates/sorting_heap_main.cpp",
      fields: [
        {
          name: "values",
          label: "待排序数字",
          type: "int-list",
          placeholder: "4 10 3 5 1 8",
          defaultValue: "4 10 3 5 1 8",
          help: "推荐 6 到 10 个数字，能清楚看到堆调整。"
        }
      ]
    },
    {
      id: "sorting_merge",
      title: "MergeSort",
      group: "Sorting",
      description: "给定一组整数，演示归并排序的分治、合并和写回。",
      template: "CPP-DSA/visual_main_templates/sorting_merge_main.cpp",
      fields: [
        {
          name: "values",
          label: "待排序数字",
          type: "int-list",
          placeholder: "6 1 5 2 4 3",
          defaultValue: "6 1 5 2 4 3",
          help: "数字太多会让合并过程较长，教学演示推荐 6 到 10 个。"
        }
      ]
    },
    {
      id: "sorting_radix",
      title: "Radix Sort",
      group: "Sorting",
      description: "给定一组整数，演示按字节从低位到高位进行稳定分配和写回。",
      template: "CPP-DSA/visual_main_templates/sorting_radix_main.cpp",
      fields: [
        {
          name: "values",
          label: "待排序数字",
          type: "int-list",
          placeholder: "170 45 75 90 802 24 2 66",
          defaultValue: "170 45 75 90 802 24 2 66",
          help: "当前模板使用整数基数排序。建议先用非负整数，更贴近常见教材示例。"
        }
      ]
    },
    {
      id: "sorting_shell",
      title: "Shell Sort",
      group: "Sorting",
      description: "给定一组整数，演示按递减 gap 做分组插入排序。",
      template: "CPP-DSA/visual_main_templates/sorting_shell_main.cpp",
      fields: [
        {
          name: "values",
          label: "待排序数字",
          type: "int-list",
          placeholder: "9 8 3 7 5 6 4 1",
          defaultValue: "9 8 3 7 5 6 4 1",
          help: "默认使用 Knuth gap 序列。"
        }
      ]
    },
    {
      id: "bst_ops",
      title: "Binary Search Tree",
      group: "Tree",
      description: "按顺序执行插入/删除，演示 BST 查找路径和删除拓扑调整。",
      template: "CPP-DSA/visual_main_templates/bst_ops_main.cpp",
      fields: [
        {
          name: "operations",
          label: "操作序列",
          type: "tree-ops",
          placeholder: "insert 5\ninsert 3\ninsert 7\ninsert 6\ninsert 8\nerase 5",
          defaultValue: "insert 5\ninsert 3\ninsert 7\ninsert 6\ninsert 8\nerase 5",
          help: "每行一个操作：insert x 或 erase x。"
        }
      ]
    },
    {
      id: "avl_ops",
      title: "AVL Tree",
      group: "Tree",
      description: "按顺序执行插入/删除，演示 AVL 失衡判断和单双旋。",
      template: "CPP-DSA/visual_main_templates/avl_ops_main.cpp",
      fields: [
        {
          name: "operations",
          label: "操作序列",
          type: "tree-ops",
          placeholder: "insert 3\ninsert 2\ninsert 1\ninsert 4\ninsert 5\nerase 2",
          defaultValue: "insert 3\ninsert 2\ninsert 1\ninsert 4\ninsert 5\nerase 2",
          help: "推荐先用会触发 LL/RR/LR/RL 的短序列。"
        }
      ]
    },
    {
      id: "rb_ops",
      title: "Red-Black Tree",
      group: "Tree",
      description: "按顺序执行插入/删除，演示红黑树重着色和旋转 case。",
      template: "CPP-DSA/visual_main_templates/rb_ops_main.cpp",
      fields: [
        {
          name: "operations",
          label: "操作序列",
          type: "tree-ops",
          placeholder: "insert 10\ninsert 8\ninsert 9\ninsert 12\ninsert 11\nerase 8",
          defaultValue: "insert 10\ninsert 8\ninsert 9\ninsert 12\ninsert 11\nerase 8",
          help: "每行一个操作：insert x 或 erase x。"
        }
      ]
    },
    {
      id: "binary_heap",
      title: "Binary Heap",
      group: "Tree",
      description: "执行 push/pop，演示数组和完全二叉树视图中的上浮/下沉。",
      template: "CPP-DSA/visual_main_templates/binary_heap_main.cpp",
      fields: [
        {
          name: "operations",
          label: "堆操作",
          type: "heap-ops",
          placeholder: "push 5\npush 1\npush 8\npush 3\npush 7\npop\npush 9\npop",
          defaultValue: "push 5\npush 1\npush 8\npush 3\npush 7\npop\npush 9\npop",
          help: "每行一个操作：push x 或 pop。当前模板使用最大堆。"
        }
      ]
    },
    {
      id: "dsu",
      title: "Disjoint Set Union",
      group: "Tree",
      description: "执行 union/find，演示森林合并和路径压缩。",
      template: "CPP-DSA/visual_main_templates/dsu_main.cpp",
      fields: [
        {
          name: "n",
          label: "元素个数",
          type: "int",
          defaultValue: "6",
          help: "元素编号为 1..n。"
        },
        {
          name: "operations",
          label: "并查集操作",
          type: "dsu-ops",
          placeholder: "union_rank 1 2\nunion_rank 3 4\nunion_rank 2 3\nfind 1\nunion_size 5 6\nunion_size 1 6",
          defaultValue: "union_rank 1 2\nunion_rank 3 4\nunion_rank 2 3\nfind 1\nunion_size 5 6\nunion_size 1 6",
          help: "支持 union_rank a b、union_size a b、find x。"
        }
      ]
    },
    {
      id: "huffman",
      title: "Huffman Tree",
      group: "Tree",
      description: "输入权值，演示每轮取两棵最小树并合并。",
      template: "CPP-DSA/visual_main_templates/huffman_main.cpp",
      fields: [
        {
          name: "weights",
          label: "叶子权值",
          type: "int-list",
          placeholder: "5 9 12 13 16 45",
          defaultValue: "5 9 12 13 16 45",
          help: "只需要输入权值，模板会自动给叶子编号。"
        }
      ]
    },
    {
      id: "graph_dijkstra",
      title: "Dijkstra",
      group: "Graph",
      description: "输入非负权图和源点，演示最短路状态表如何更新。",
      template: "CPP-DSA/visual_main_templates/graph_dijkstra_main.cpp",
      fields: [
        { name: "n", label: "节点个数", type: "int", defaultValue: "5", help: "节点编号为 1..n。" },
        { name: "directed", label: "是否有向图", type: "boolean", defaultValue: "false", help: "Dijkstra 常见教学示例可先用无向图。" },
        { name: "source", label: "源点", type: "int", defaultValue: "1", help: "从哪个节点开始计算最短路。" },
        {
          name: "edges",
          label: "带权边",
          type: "weighted-edges",
          placeholder: "1 2 2\n1 3 5\n2 3 1\n2 4 2\n3 5 3\n4 5 1",
          defaultValue: "1 2 2\n1 3 5\n2 3 1\n2 4 2\n3 5 3\n4 5 1",
          help: "每行一条边：u v w。Dijkstra 要求权重非负。"
        }
      ]
    },
    {
      id: "graph_floyd",
      title: "Floyd",
      group: "Graph",
      description: "输入带权图，演示全源最短路矩阵如何被中转点更新。",
      template: "CPP-DSA/visual_main_templates/graph_floyd_main.cpp",
      fields: [
        { name: "n", label: "节点个数", type: "int", defaultValue: "5", help: "节点编号为 1..n。" },
        { name: "directed", label: "是否有向图", type: "boolean", defaultValue: "true", help: "Floyd 示例默认有向图。" },
        {
          name: "edges",
          label: "带权边",
          type: "weighted-edges",
          placeholder: "1 2 2\n1 3 5\n2 3 1\n2 4 2\n3 5 3\n4 5 1",
          defaultValue: "1 2 2\n1 3 5\n2 3 1\n2 4 2\n3 5 3\n4 5 1",
          help: "每行一条边：u v w。"
        }
      ]
    },
    {
      id: "graph_prim",
      title: "Prim",
      group: "Graph",
      description: "输入无向带权图，演示最小生成树如何逐点扩张。",
      template: "CPP-DSA/visual_main_templates/graph_prim_main.cpp",
      fields: [
        { name: "n", label: "节点个数", type: "int", defaultValue: "5", help: "节点编号为 1..n。" },
        {
          name: "edges",
          label: "无向带权边",
          type: "weighted-edges",
          placeholder: "1 2 2\n1 3 5\n2 3 1\n2 4 2\n3 5 3\n4 5 1",
          defaultValue: "1 2 2\n1 3 5\n2 3 1\n2 4 2\n3 5 3\n4 5 1",
          help: "每行一条边：u v w。Prim 模板固定按无向图处理。"
        }
      ]
    },
    {
      id: "graph_kahn",
      title: "Kahn Topological Sort",
      group: "Graph",
      description: "输入 DAG，演示入度表、队列和拓扑序如何变化。",
      template: "CPP-DSA/visual_main_templates/graph_kahn_main.cpp",
      fields: [
        { name: "n", label: "节点个数", type: "int", defaultValue: "5", help: "节点编号为 1..n。" },
        {
          name: "edges",
          label: "有向边",
          type: "edges",
          placeholder: "1 2\n1 3\n2 4\n3 4\n4 5",
          defaultValue: "1 2\n1 3\n2 4\n3 4\n4 5",
          help: "每行一条边：u v。图应当是 DAG。"
        }
      ]
    },
    {
      id: "kmp_match",
      title: "KMP Match",
      group: "String",
      description: "输入文本串和模式串，先展示 next 预处理，再展示匹配扫描。",
      template: "CPP-DSA/visual_main_templates/kmp_match_main.cpp",
      fields: [
        { name: "text", label: "文本串", type: "string", defaultValue: "ababcabcabababd", help: "被搜索的长串。" },
        { name: "pattern", label: "模式串", type: "string", defaultValue: "ababd", help: "要查找的短串。" }
      ]
    }
  ];

  function byId(id) {
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i].id === id) {
        return catalog[i];
      }
    }
    return null;
  }

  /**
   * @namespace DSAAlgorithmCatalog
   * @memberof js_input_helper_api
   * @description Built-in algorithm catalog consumed by the input helper and trace service glue code.
   */
  window.DSAAlgorithmCatalog = {
    /**
     * Return all built-in algorithm definitions.
     * @memberof DSAAlgorithmCatalog
     * @returns {Array<Object>} Shallow copy of catalog entries.
     */
    all: function () {
      return catalog.slice();
    },
    /**
     * Find one algorithm definition by id.
     * @memberof DSAAlgorithmCatalog
     * @param {string} id Algorithm id, for example `sorting_quick`.
     * @returns {Object|null} Catalog entry or null.
     */
    byId: byId
  };
})();
