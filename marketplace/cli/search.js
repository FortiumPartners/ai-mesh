#!/usr/bin/env node

/**
 * AI Mesh Plugin Search Tool
 *
 * Command-line tool for searching and discovering plugins in the AI Mesh marketplace.
 *
 * Usage:
 *   ai-mesh-marketplace search [query]
 *   ai-mesh-marketplace search --category <category>
 *   ai-mesh-marketplace search --tag <tag>
 *   ai-mesh-marketplace search --featured
 *
 * Examples:
 *   ai-mesh-marketplace search
 *   ai-mesh-marketplace search "monitoring"
 *   ai-mesh-marketplace search --category monitoring
 *   ai-mesh-marketplace search --tag wezterm
 *   ai-mesh-marketplace search --featured
 */

const https = require('https');

// Configuration
const REGISTRY_URL = 'https://raw.githubusercontent.com/FortiumPartners/ai-mesh-marketplace/main/registry/plugins.json';

/**
 * Main search function
 */
async function search(query, options = {}) {
  try {
    // Fetch registry
    const registry = await fetchRegistry();

    // Filter plugins
    let results = registry.plugins;

    if (options.category) {
      results = results.filter(p => p.category === options.category);
    }

    if (options.tag) {
      results = results.filter(p => p.tags && p.tags.includes(options.tag));
    }

    if (options.featured) {
      results = results.filter(p => p.featured === true);
    }

    if (options.status) {
      results = results.filter(p => p.status === options.status);
    }

    if (query) {
      results = results.filter(p => {
        const searchText = `${p.name} ${p.displayName} ${p.description} ${p.tags?.join(' ')}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });
    }

    // Sort results
    results.sort((a, b) => {
      // Featured plugins first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // Then by status (stable > preview > deprecated)
      const statusOrder = { stable: 0, preview: 1, deprecated: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      // Finally alphabetically
      return a.displayName.localeCompare(b.displayName);
    });

    // Display results
    displayResults(results, registry);

  } catch (error) {
    console.error(`\n❌ Search failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Display search results
 */
function displayResults(plugins, registry) {
  if (plugins.length === 0) {
    console.log('\nNo plugins found matching your criteria.');
    return;
  }

  console.log(`\nFound ${plugins.length} plugin${plugins.length > 1 ? 's' : ''}:\n`);

  plugins.forEach((plugin, index) => {
    const statusBadge = getStatusBadge(plugin.status);
    const featuredBadge = plugin.featured ? '⭐' : '';

    console.log(`${index + 1}. ${featuredBadge} ${plugin.displayName} ${statusBadge}`);
    console.log(`   ${plugin.name}@${plugin.version}`);
    console.log(`   ${plugin.description}`);
    console.log(`   Category: ${plugin.category} | Tier: ${plugin.tier}`);
    console.log(`   Tags: ${plugin.tags?.join(', ') || 'none'}`);

    if (plugin.npm) {
      console.log(`   Install: npm install -g ${plugin.npm}`);
    }

    console.log('');
  });

  // Display category summary
  const categories = [...new Set(plugins.map(p => p.category))];
  console.log(`Categories: ${categories.join(', ')}`);

  // Display helpful tips
  console.log('\nTips:');
  console.log('  • Use --category to filter by category');
  console.log('  • Use --tag to filter by tag');
  console.log('  • Use --featured to see featured plugins only');
  console.log('  • Run "ai-mesh-marketplace show <plugin-name>" for details');
}

/**
 * Get status badge emoji
 */
function getStatusBadge(status) {
  const badges = {
    stable: '✅',
    preview: '🚧',
    deprecated: '⚠️'
  };
  return badges[status] || '';
}

/**
 * Show detailed information for a plugin
 */
async function showPlugin(pluginName) {
  try {
    const registry = await fetchRegistry();
    const plugin = registry.plugins.find(p => p.name === pluginName);

    if (!plugin) {
      console.error(`❌ Plugin "${pluginName}" not found`);
      process.exit(1);
    }

    // TODO: Display detailed plugin information
    //
    // Should include:
    // - Full description
    // - Author information
    // - Repository and documentation links
    // - Dependencies
    // - Installation instructions
    // - Screenshots (if available)
    // - Version history
    // - Compatibility information

    console.log(`\n${plugin.displayName} v${plugin.version}`);
    console.log('='.repeat(50));
    console.log(`\nDescription: ${plugin.description}`);
    console.log(`\nAuthor: ${plugin.author.name}`);
    if (plugin.author.email) console.log(`Email: ${plugin.author.email}`);
    if (plugin.author.url) console.log(`Website: ${plugin.author.url}`);

    console.log(`\nCategory: ${plugin.category}`);
    console.log(`Tier: ${plugin.tier}`);
    console.log(`Status: ${plugin.status}`);
    console.log(`Featured: ${plugin.featured ? 'Yes' : 'No'}`);

    if (plugin.tags && plugin.tags.length > 0) {
      console.log(`\nTags: ${plugin.tags.join(', ')}`);
    }

    if (plugin.repository) {
      console.log(`\nRepository: ${plugin.repository}`);
    }

    if (plugin.documentation) {
      console.log(`Documentation: ${plugin.documentation}`);
    }

    if (plugin.npm) {
      console.log(`\nNPM Package: ${plugin.npm}`);
      console.log(`\nInstallation:`);
      console.log(`  npm install -g ${plugin.npm}`);
      console.log(`  # or`);
      console.log(`  ai-mesh-marketplace install ${plugin.name}`);
    }

    if (plugin.dependencies && Object.keys(plugin.dependencies).length > 0) {
      console.log(`\nDependencies:`);
      Object.entries(plugin.dependencies).forEach(([dep, version]) => {
        console.log(`  • ${dep}: ${version}`);
      });
    }

    console.log('');

  } catch (error) {
    console.error(`\n❌ Failed to fetch plugin details: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Fetch plugin registry from GitHub
 */
function fetchRegistry() {
  return new Promise((resolve, reject) => {
    https.get(REGISTRY_URL, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const registry = JSON.parse(data);
          resolve(registry);
        } catch (error) {
          reject(new Error('Failed to parse registry: ' + error.message));
        }
      });

    }).on('error', (error) => {
      reject(new Error('Failed to fetch registry: ' + error.message));
    });
  });
}

/**
 * Parse command-line arguments
 */
function parseArgs(args) {
  const options = {
    category: null,
    tag: null,
    featured: false,
    status: null
  };

  let query = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--category' || arg === '-c') {
      options.category = args[++i];
    } else if (arg === '--tag' || arg === '-t') {
      options.tag = args[++i];
    } else if (arg === '--featured' || arg === '-f') {
      options.featured = true;
    } else if (arg === '--status' || arg === '-s') {
      options.status = args[++i];
    } else if (!arg.startsWith('--')) {
      query = arg;
    }
  }

  return { query, options };
}

/**
 * Display help message
 */
function showHelp() {
  console.log(`
AI Mesh Plugin Search Tool

Usage:
  ai-mesh-marketplace search [query] [options]
  ai-mesh-marketplace show <plugin-name>

Search Options:
  --category, -c <cat>   Filter by category
  --tag, -t <tag>        Filter by tag
  --featured, -f         Show featured plugins only
  --status, -s <status>  Filter by status (stable, preview, deprecated)
  --help, -h             Show this help message

Categories:
  core, monitoring, workflow, frameworks, testing, infrastructure

Examples:
  ai-mesh-marketplace search
  ai-mesh-marketplace search "monitoring"
  ai-mesh-marketplace search --category monitoring
  ai-mesh-marketplace search --tag wezterm
  ai-mesh-marketplace search --featured
  ai-mesh-marketplace show ai-mesh-pane-viewer

For more information, visit:
  https://github.com/FortiumPartners/ai-mesh-marketplace
  `);
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (command === 'show' && args.length > 1) {
    showPlugin(args[1]).catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
  } else {
    const { query, options } = parseArgs(args);
    search(query, options).catch(error => {
      console.error('Search error:', error);
      process.exit(1);
    });
  }
}

module.exports = { search, showPlugin, fetchRegistry };
