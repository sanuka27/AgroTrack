import { swaggerSpec } from '../config/swagger';
import fs from 'fs';
import path from 'path';

/**
 * Script to generate and validate API documentation
 * This script can be run to:
 * 1. Validate the Swagger specification
 * 2. Generate static documentation files
 * 3. Output API endpoint summary
 */

interface EndpointInfo {
  path: string;
  method: string;
  summary: string;
  tags: string[];
  security: boolean;
}

class DocumentationGenerator {
  private spec: any;

  constructor() {
    this.spec = swaggerSpec;
  }

  /**
   * Validate the Swagger specification
   */
  validateSpec(): boolean {
    try {
      // Basic validation checks
      if (!this.spec.info) {
        throw new Error('Missing API info section');
      }

      if (!this.spec.info.title) {
        throw new Error('Missing API title');
      }

      if (!this.spec.info.version) {
        throw new Error('Missing API version');
      }

      if (!this.spec.paths) {
        throw new Error('Missing API paths');
      }

      console.log('✅ Swagger specification is valid');
      return true;
    } catch (error) {
      console.error('❌ Swagger specification validation failed:', error);
      return false;
    }
  }

  /**
   * Extract endpoint information from the spec
   */
  extractEndpoints(): EndpointInfo[] {
    const endpoints: EndpointInfo[] = [];

    if (!this.spec.paths) {
      return endpoints;
    }

    Object.keys(this.spec.paths).forEach(path => {
      const pathItem = this.spec.paths[path];
      
      Object.keys(pathItem).forEach(method => {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          const operation = pathItem[method];
          
          endpoints.push({
            path: `/api${path}`,
            method: method.toUpperCase(),
            summary: operation.summary || 'No summary provided',
            tags: operation.tags || [],
            security: operation.security !== undefined ? operation.security.length > 0 : true
          });
        }
      });
    });

    return endpoints;
  }

  /**
   * Generate API endpoint summary
   */
  generateEndpointSummary(): string {
    const endpoints = this.extractEndpoints();
    let summary = `# AgroTrack API Documentation Summary\n\n`;
    summary += `Generated on: ${new Date().toISOString()}\n`;
    summary += `Total Endpoints: ${endpoints.length}\n\n`;

    // Group by tags
    const groupedEndpoints = endpoints.reduce((groups, endpoint) => {
      const tag = endpoint.tags[0] || 'Untagged';
      if (!groups[tag]) {
        groups[tag] = [];
      }
      groups[tag].push(endpoint);
      return groups;
    }, {} as Record<string, EndpointInfo[]>);

    Object.keys(groupedEndpoints).sort().forEach(tag => {
      summary += `## ${tag}\n\n`;
      if (groupedEndpoints[tag]) {
        groupedEndpoints[tag].forEach(endpoint => {
          const securityIcon = endpoint.security ? '🔒' : '🌐';
          summary += `- ${securityIcon} **${endpoint.method}** \`${endpoint.path}\` - ${endpoint.summary}\n`;
        });
      }
      summary += '\n';
    });

    // Add security legend
    summary += `## Security Legend\n\n`;
    summary += `- 🔒 Requires authentication (Bearer token)\n`;
    summary += `- 🌐 Public endpoint (no authentication required)\n\n`;

    // Add rate limiting info
    summary += `## Rate Limiting\n\n`;
    summary += `- **General endpoints**: 1000 requests per 15 minutes\n`;
    summary += `- **Authentication**: 50 requests per 15 minutes\n`;
    summary += `- **Login attempts**: 10 requests per 15 minutes\n`;
    summary += `- **Search**: 100 requests per 15 minutes\n`;
    summary += `- **Admin operations**: 100 requests per 15 minutes\n`;
    summary += `- **File uploads**: 20 requests per 15 minutes\n`;
    summary += `- **Export/Import**: 10 requests per hour\n\n`;

    return summary;
  }

  /**
   * Generate OpenAPI JSON file
   */
  generateOpenAPIFile(outputPath: string): void {
    try {
      const jsonSpec = JSON.stringify(this.spec, null, 2);
      fs.writeFileSync(outputPath, jsonSpec);
      console.log(`✅ OpenAPI specification saved to: ${outputPath}`);
    } catch (error) {
      console.error('❌ Failed to generate OpenAPI file:', error);
    }
  }

  /**
   * Generate markdown documentation
   */
  generateMarkdownDoc(outputPath: string): void {
    try {
      const summary = this.generateEndpointSummary();
      fs.writeFileSync(outputPath, summary);
      console.log(`✅ API documentation summary saved to: ${outputPath}`);
    } catch (error) {
      console.error('❌ Failed to generate markdown documentation:', error);
    }
  }

  /**
   * Run all documentation generation tasks
   */
  run(): void {
    console.log('📚 Starting API documentation generation...\n');

    // Validate specification
    if (!this.validateSpec()) {
      process.exit(1);
    }

    // Create docs directory if it doesn't exist
    const docsDir = path.join(__dirname, '../../docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Generate files
    this.generateOpenAPIFile(path.join(docsDir, 'openapi.json'));
    this.generateMarkdownDoc(path.join(docsDir, 'API_SUMMARY.md'));

    // Display endpoint summary
    console.log('\n📊 API Endpoints Summary:');
    console.log('=' .repeat(50));
    const endpoints = this.extractEndpoints();
    
    const methodCounts = endpoints.reduce((counts, endpoint) => {
      counts[endpoint.method] = (counts[endpoint.method] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    Object.keys(methodCounts).forEach(method => {
      console.log(`${method}: ${methodCounts[method]} endpoints`);
    });

    const authRequired = endpoints.filter(e => e.security).length;
    const publicEndpoints = endpoints.length - authRequired;
    
    console.log(`\n🔒 Authentication required: ${authRequired} endpoints`);
    console.log(`🌐 Public endpoints: ${publicEndpoints} endpoints`);
    console.log(`📊 Total endpoints: ${endpoints.length}`);

    console.log('\n✅ Documentation generation completed!');
    console.log(`\n📖 View documentation at: http://localhost:5000/api-docs`);
    console.log(`📄 OpenAPI JSON: http://localhost:5000/api-docs.json`);
  }
}

// Run the documentation generator if this script is executed directly
if (require.main === module) {
  const generator = new DocumentationGenerator();
  generator.run();
}

export { DocumentationGenerator };