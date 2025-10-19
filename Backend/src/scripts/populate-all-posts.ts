import mongoose from 'mongoose';
import { CommunityPost } from '../models/CommunityPost';
import dotenv from 'dotenv';

dotenv.config();

// Comprehensive content for all 50 community posts
const generatePostBody = (title: string): string => {
  // Create relevant, detailed content based on the title
  const bodies: { [key: string]: string } = {
    "Best practices for organic pest control?": "Looking for comprehensive organic pest control strategies. Currently using neem oil, companion planting, and hand-picking. Still struggling with aphids and flea beetles. What are your proven organic methods for both prevention and active pest control?",
    
    "My hydroponic lettuce setup - 30 days progress": "Started my first hydroponic lettuce system 30 days ago using NFT (Nutrient Film Technique). Growing 5 varieties: buttercrunch, romaine, red leaf, green leaf, and oakleaf. The growth has been incredible - lettuce is ready to harvest in half the time compared to soil! Using a 12-16-8 hydroponic nutrient solution. pH staying stable around 6.0. Only issue so far was algae growth in the channels, solved by blocking light. Anyone else growing hydro lettuce? Tips for preventing tip burn?",
    
    "Help! My cucumber leaves are turning yellow": "My cucumber plants' lower leaves started yellowing last week and it's spreading upward. Plants are 4 weeks old in raised beds, full sun, watering every 2-3 days. No visible pests. Could this be nitrogen deficiency, overwatering, or bacterial wilt? Should I remove yellow leaves or leave them? Need help diagnosing!",
    
    "Companion planting guide for beginners": "Want to start companion planting this season but feeling overwhelmed by all the information. What are the  MUST-KNOW combinations for beginners? I'm growing tomatoes, peppers, cucumbers, beans, lettuce, and herbs. Which plants should definitely go together and which should be kept apart? Looking for simple, proven pairings!",
    
    "DIY compost bin - Built for under $50": "Just finished building a 3-bin compost system using pallets from a local store (free!). Spent about $45 on wire mesh, hinges, and wood treatment. Each bin holds about 27 cubic feet. Design allows for turning compost by moving it from bin to bin. Added airflow holes on sides. Happy to share plans if anyone's interested! Way cheaper than buying commercial bins.",
    
    "When to harvest garlic? Signs to look for": "First time growing garlic (planted last October) and not sure when to harvest. It's now June and the leaves are starting to brown from the bottom up. I've heard you harvest when 1/3 to 1/2 of leaves are brown, but I'm nervous about timing. What are the definitive signs? Is it better to harvest early or wait? What happens if I leave it too long?",
    
    "Successfully grew 200+ lbs of potatoes in grow bags!": "Final harvest report: Got 215 lbs of potatoes from 10 grow bags! Used 15-gallon fabric pots, planted 3 seed potatoes per bag. Varieties: Yukon Gold, Kennebec, and Red Pontiac. Started with 6 inches of soil, added more as plants grew. Key lessons: consistent watering is critical, don't overfill bags, harvest when plants die back completely. This method is perfect for small spaces!",
    
    "Drip irrigation vs soaker hoses - Which is better?": "Planning to upgrade from hand watering and debating between drip irrigation system vs soaker hoses. Garden is 20x30 feet with 8 raised beds. Drip seems more precise but expensive and complex. Soaker hoses are simpler but I've heard they can clog. Which do you use and why? Is the extra cost of drip worth it for vegetable gardens?",
    
    "Seed starting setup - What worked for me": "After years of leggy seedlings, finally got a setup that works! Using: 4-foot T5 fluorescent lights (2 bulbs), lights 2-3 inches above seedlings, 16 hours/day. Heat mats for peppers and tomatoes. Seedling mix: 50% peat, 30% perlite, 20% vermiculite. Bottom watering only. Started hardening off 2 weeks before transplant. Success rate went from 50% to 95%! Happy to answer setup questions.",
    
    "Why are my pepper plants flowering but no fruit?": "My pepper plants are loaded with flowers but they keep dropping without setting fruit. Plants look healthy, getting 8+ hours sun. Flowering started 3 weeks ago. Is it too hot? (Temps are 90-95°F during day). Do I need to hand pollinate? Should I be fertilizing differently? Getting frustrated watching all these flowers drop!",
    
    "Best mulch for vegetable gardens?": "What mulch do you use in vegetable beds? I've tried: straw (had weed seeds), wood chips (worried about nitrogen tie-up), grass clippings (matted and smelled). Considering pine needles or shredded leaves. What works best for moisture retention without causing problems? How thick should the layer be?",
    
    "My first successful strawberry harvest!": "Picked 8 pounds of strawberries from my 4x8 bed this week! Planted 25 bare-root June-bearing plants last spring. They didn't produce much year one but this year they went crazy. Protected with bird netting and added sulfur to lower pH. Best advice: be patient year one, renovate bed after harvest, and protect from birds. The wait was worth it!",
    
    "Dealing with powdery mildew naturally": "Powdery mildew covering my squash and cucumber leaves. Tried baking soda spray (didn't work), now using milk spray (1:9 ratio). Seeing some improvement. Is it safe to eat vegetables from infected plants? Should I remove badly affected leaves? Looking for proven natural treatments and prevention strategies for next year.",
    
    "Container gardening tips for small spaces": "Living in apartment with 6x3 ft balcony (east-facing). Want to maximize vegetable production in containers. Currently have: cherry tomatoes in 5-gal buckets, herbs in railing planters, lettuce in window boxes. Questions: best compact varieties? Self-watering containers worth it? How to deal with weight limits? Tips for windy balconies?",
    
    "When to prune fruit trees?": "Have apple, pear, and cherry trees (2-3 years old). Never pruned before and they're getting messy. When's the best time to prune? I've heard late winter for apples/pears but different for cherries? How much can I safely remove without shocking the tree? Any good resources for pruning techniques? Nervous about making mistakes!",
    
    "Vertical gardening ideas needed": "Have 6-foot privacy fence getting full sun but limited ground space. Want to maximize production growing vertically. Considering: cattle panel trellises, pallet gardens, tower gardens, espalier fruit trees. What's worked best for you? Looking for DIY-friendly projects. Which crops are best for vertical growing?",
    
    "Best varieties for hot climates?": "Moving to zone 9 (desert climate) and need heat-tolerant varieties. Used to growing in zone 6. What tomato, pepper, squash, and bean varieties handle extreme heat (100°F+ summers)? Do I focus on spring/fall planting and skip summer? Any tips for desert gardening appreciated!",
    
    "My rain garden project - 1 year update": "Installed rain garden last spring to manage runoff from downspouts. Planted native plants: swamp milkweed, joe pye weed, cardinal flower, blue flag iris. One year later: area drains perfectly, plants thriving, attracted tons of pollinators! Best decision. Cost about $200 for plants. Dug 12-inch depression, amended with compost. Would recommend to anyone with drainage issues.",
    
    "Protecting plants from late frost": "Weather forecast shows unexpected frost next week and I have tender seedlings already planted (tomatoes, peppers, beans). What's the best protection? Planning to use row covers but wondering about: plastic vs fabric, whether to leave on all day or just at night, using Wall O' Water for tomatoes. What's worked for you?",
    
    "Organic fertilizer recommendations?": "Transitioning to organic fertilizers. Currently using: fish emulsion (5-1-1) for nitrogen, bone meal (4-12-0) for phosphorus, kelp meal (1-0-2) for potassium + micronutrients. Is this sufficient or should I use a complete organic fertilizer? How often to apply? Looking for simple, effective organic feeding schedule.",
    
    "Starting a pollinator garden": "Want to create pollinator-friendly area in corner of yard. Goals: attract bees, butterflies, hummingbirds. Planning native plants with blooms spring through fall. Which plants are must-haves for pollinators? Should I include host plants for caterpillars? Water source needed? Size of area: 10x10 feet, full sun.",
    
    "Best cover crops for winter?": "Want to plant cover crops this fall in empty vegetable beds (zone 6). Goals: add nitrogen, prevent erosion, improve soil. Considering: winter rye, hairy vetch, crimson clover. Which do you recommend? When to plant and when to till under in spring? Can I plant mix of several cover crops together?",
    
    "My greenhouse build - cost breakdown": "Finished building 10x12 greenhouse! Total cost: $1,850. Breakdown: lumber frame ($450), polycarbonate panels ($680), door/vents ($320), foundation/gravel ($200), misc hardware ($200). DIY saved about $3,000 vs buying prefab. Took 3 weekends. Already extended season by 6 weeks! Planning to add heater for winter growing. Happy to share plans.",
    
    "Succession planting guide?": "Want to do succession planting for continuous harvests but confused about timing. For crops like lettuce, beans, carrots - how often should I plant new seeds? Do I plant small amounts every 2 weeks? What's worked for you? My goal is steady supply without gluts. Garden is 400 sq ft.",
    
    "Best tools for a beginner gardener": "Just started gardening and overwhelmed by tool options. What are the essential tools I actually need? Currently have: shovel, hand trowel, hose. What else is worth buying? Considering: wheel hoe, broadfork, Japanese hand hoe. What tools do you use most? Where to spend vs save money?",
    
    "My herb spiral garden design": "Built herb spiral last month - 4 feet diameter, 3 feet tall at center using urbanite (broken concrete). Different microclimates at different heights. Top (hot/dry): rosemary, thyme, oregano. Middle: basil, cilantro. Bottom (moist): parsley, mint. Looks beautiful and herbs are thriving! Great space-saver for herb variety. Cost $40 for materials.",
    
    "Protecting crops from deer and rabbits": "Deer and rabbits eating everything! Lost entire bean crop and they're starting on tomatoes. Garden is 40x30 feet. Options: 8-foot fence (expensive!), electric fence, individual cages, repellents. What actually works? Are motion-activated sprinklers effective? Getting desperate - need reliable solution.",
    
    "Microgreens growing setup": "Started growing microgreens indoors - selling at farmers market! Growing sunflower, pea shoots, radish, broccoli. Using: 10x20 trays, seed starting mix, T5 lights. Harvest in 7-14 days. Learning curve was steep but profitable now. Questions about microgreens? Happy to help others get started!",
    
    "Best time to transplant seedlings?": "Started tomatoes, peppers, eggplant indoors 8 weeks ago. How do I know when seedlings are ready to transplant? Should I wait for first true leaves? Certain size? Last frost date here is May 15th - when should I start hardening off? How long is hardening off process? First time starting from seed!",
    
    "My square foot garden layout": "Using square foot gardening method - 4x4 raised beds with grid. Love the organization and space efficiency! Planted: 16 carrots per square, 9 beets, 4 lettuce, 1 tomato, etc. Intensi ve planting is amazing for small spaces. Using Mel's Mix (1/3 compost, 1/3 peat, 1/3 vermiculite). Yields are incredible for the space!",
    
    "Dealing with blossom end rot": "Tomatoes getting blossom end rot - black, sunken spots on bottom of fruits. Read it's calcium deficiency but my soil test shows adequate calcium. Is it a watering issue? I water deeply 2x per week. Should I add calcium anyway? Use foliar spray or soil amendment? How to prevent on developing fruits?",
    
    "Best plants for clay soil?": "Heavy clay soil - rock hard when dry, sticky when wet. Drainage is terrible. Started amending with compost but it's slow going. Which vegetables tolerate clay best while I improve the soil? Considering raised beds but want to try working with what I have first. Zone 6b.",
    
    "My worm composting journey": "Started vermicomposting 6 months ago with 1 pound of red wigglers. Now have thriving bin producing amazing compost! Using stacking bin system. Feeding: vegetable scraps, coffee grounds, shredded paper. Mistakes made: overfeeding at first (stinky!), not enough bedding. Tips: keep moist not wet, bury food scraps, harvest every 3-4 months.",
    
    "Saving seeds - tips and tricks": "Want to start saving seeds to become more self-sufficient. Which vegetables are easiest to start with? I grow: tomatoes, peppers, beans, squash, lettuce. Do I need to know about cross-pollination? How to properly dry and store seeds? How long do saved seeds last? Complete beginner to seed saving!",
    
    "Best tomato varieties for flavor?": "Prioritizing flavor over yield this year. What are the most delicious tomato varieties you've grown? Interested in: Cherokee Purple (heard great things), Brandywine, Black Krim. Looking for rich, complex flavor for fresh eating. Don't care about uniformity or production - just want amazing taste! Zone 6.",
    
    "My lasagna garden method results": "Tried lasagna gardening (sheet mulching) this year - layered cardboard, compost, leaves, grass clippings directly on lawn. No tilling! Started in fall, planted in spring. Soil is incredible - dark, loose, full of worms. Plants are thriving. Best part: no weeding! This method is perfect for starting new beds. Total cost: $0 (used yard waste).",
    
    "Best crops for fall planting?": "Want to extend growing season with fall plantings (zone 7). When should I plant for fall harvest? Considering: lettuce, spinach, kale, broccoli, carrots, radishes. How to calculate planting dates? Do I need to protect from frost? First time doing fall garden - any tips?",
    
    "My aquaponics setup - month 3": "Running small aquaponics system: 275-gal fish tank with 10 goldfish, 2 grow beds (flood & drain). Growing lettuce, herbs, tomatoes. Cycle is established, nitrates perfect, plants growing fast. Challenges: maintaining water temp, adjusting pH. Benefits: never buying fertilizer, therapeutic fish watching. Cost about $400 DIY. Would recommend!",
    
    "Pruning tomatoes - yes or no?": "Debate in my garden club: should you prune tomato plants? I've been removing suckers and bottom leaves. Friend says this stresses plants and reduces yield. Who's right? Does it depend on determinate vs indeterminate? What are actual benefits of pruning? Does it really prevent disease?",
    
    "Best groundcover for paths?": "Need groundcover for paths between raised beds. Want: low-maintenance, tolerates foot traffic, stays green, prevents mud. Considering: clover, thyme, gravel, wood chips. Paths get part shade. Which groundcover works best for garden paths? How to establish living groundcover?",
    
    "My mushroom growing adventure": "Started growing oyster mushrooms indoors! Using hardwood sawdust blocks inoculated with spawn. First flush appeared after 3 weeks - harvested 2 pounds! Maintaining 70°F and high humidity. Growing in basement. It's easier than expected. Next trying shiitake on logs. Anyone else growing mushrooms? Tips for beginners?",
    
    "Best perennial vegetables?": "Want to plant more perennials - tired of replanting annually. Already have: asparagus (year 3), rhubarb, horseradish. What other productive perennial vegetables? Considering: Jerusalem artichokes, walking onions, sea kale, Good King Henry. Which are worth the space? Zone 6, full sun available.",
    
    "My chicken coop garden integration": "Integrated chicken coop with garden using rotating grazing system. Chickens access different sections on schedule, fertilize and control pests, then area rests. Using mobile fencing. Benefits: natural fertilizer, pest control, entertainment. Challenges: protecting plants, managing manure. 6 hens, 1,000 sq ft garden. Working great!",
    
    "Grafting fruit trees - beginner guide": "Want to start grafting fruit trees - adding varieties to existing trees. Questions: Best time of year? Easiest grafting method for beginners? Essential tools needed? How to know if graft successful? How long until grafted branch produces? Looking for beginner-friendly guidance from experienced grafters.",
    
    "Best shade-tolerant vegetables?": "Yard section gets only 3-4 hours direct sun (morning). Want to grow vegetables there. Know lettuce works, but what else? Looking for shade-tolerant: herbs, roots, greens, anything productive. Should I focus on spring/fall crops? Or are there summer vegetables for shade? Zone 7, good soil.",
    
    "My food forest design - year 2": "Year 2 of backyard food forest (zone 7a). Layers: canopy trees (apple, pear, cherry), understory (mulberry, elderberry), shrubs (blueberry, currants, hazelnuts), herbs (asparagus, artichoke), groundcover (strawberries, clover), vines (grapes), roots (Jerusalem artichoke). Trees establishing well, groundcover filling in. Need more nitrogen fixers. Anyone else growing food forests?",
    
    "Composting in small spaces": "Apartment balcony - want to compost kitchen scraps. Researching: vermicomposting (worm bins), bokashi (fermentation), electric composters. Main concerns: no smell, no pests, easy maintenance, actually produces compost. Generate 2-3 cups scraps daily. Which method works best for small indoor/balcony spaces?",
    
    "Clay soil amendment tips": "Heavy clay soil - hard when dry, sticky when wet, terrible drainage. Started adding compost but it's slow. Questions: How long to improve clay? Should I use raised beds instead? Worth double-digging? Any cover crops that break up clay? Add sand? (heard mixed advice). Soil is 80% clay. Committed to improving it!",
    
    "Starting seeds indoors - setup": "Planning to start seeds indoors instead of buying transplants. Starting: tomatoes, peppers, eggplant (8-10 weeks before frost), broccoli, cabbage, lettuce (6-8 weeks). Questions about setup: LED vs fluorescent lights? How many hours daily? Heat mats necessary? Seed starting mix recipe? When to pot up? How to prevent leggy seedlings? Complete beginner!",
    
    "Winter gardening in zone 6": "Want to extend season and possibly grow through winter (zone 6). Considering: cold frames for greens, row covers for roots, overwintering crops (garlic, onions), indoor microgreens. What vegetables are truly cold-hardy enough? DIY cold frame plans? When to plant for winter harvest? Anyone successfully winter garden zone 6?",
    
    "Container gardening on apartment balcony": "Small apartment balcony (6x3 ft, east-facing, 4th floor). Want to grow vegetables/herbs in containers. Plans: railing planters for herbs, 5-gallon buckets for tomatoes/peppers, vertical trellis for beans, strawberry tower. Concerns: weight limits, wind (4th floor), watering in small containers, only morning sun (4-5 hours). Best container vegetables?",
    
    "Vertical gardening ideas": "Limited ground space - maximizing production vertically. Considering: cattle panel trellises for cucumbers/beans, tower gardens for strawberries/lettuce, pallet gardens for herbs, espalier fruit trees on fence, hanging baskets for tomatoes. Have 6-foot fence with full sun. What gives best yields? DIY structure plans? Watering tips for vertical gardens?",
    
    "Growing tomatoes in containers": "First time growing tomatoes in containers - need advice. Have determinate varieties, 5-gallon buckets. Questions: Is 5 gallons big enough or go bigger? Best potting mix for tomatoes? Watering frequency in containers? Fertilizing schedule? Staking determinate varieties? Containers on sunny patio (full sun). Tips for healthy, productive container tomatoes?",
    
    "Potato growing in towers": "Trying potato towers - 4-foot wire mesh cylinders filled with compost/straw. Concept: add soil as plants grow, potatoes form along buried stems for huge harvest in small space. Questions: Does this actually work or gardening myth? Best varieties for towers? How often add soil? When harvest? Tips for success? Excited but skeptical!"
  };

  return bodies[title] || `This is a community discussion about ${title}. Members share their experiences, ask questions, and provide advice to help each other succeed in their gardening journey.`;
};

async function populateAllPosts() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://sanuka:Sanuka123@agrotrack.vdhiw.mongodb.net/agrotrack?retryWrites=true&w=majority&appName=AgroTrack';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    const posts = await CommunityPost.find({}).lean();
    console.log(`Found ${posts.length} posts in database\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const post of posts) {
      if (post.body && post.body.trim().length > 0) {
        console.log(`⊘ Skipped: "${post.title}" - already has content`);
        skippedCount++;
        continue;
      }

      const newBody = generatePostBody(post.title);
      await CommunityPost.updateOne(
        { _id: post._id },
        { 
          $set: { 
            body: newBody,
            updatedAt: new Date()
          } 
        }
      );
      console.log(`✓ Updated: "${post.title}"`);
      updatedCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total posts:                 ${posts.length}`);
    console.log(`Updated with new content:    ${updatedCount}`);
    console.log(`Skipped (had content):       ${skippedCount}`);
    console.log('='.repeat(50) + '\n');

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    console.log('\n✅ All posts now have relevant content!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateAllPosts();
