import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleTextStories = [
  {
    title: "The Little Star Who Lost Her Light",
    summary: "A heartwarming tale about a young star who discovers that helping others brings back her own light.",
    contentMd: `# The Little Star Who Lost Her Light

Once upon a time, in the vast night sky, there lived a little star named Luna. Luna was once the brightest star in her constellation, twinkling with joy and spreading light across the darkness.

## Chapter 1: The Dimming Light

One morning, Luna woke up to find that her light had grown dim. She tried to shine as bright as before, but nothing worked. The other stars in her constellation began to worry.

"What happened to your beautiful light, Luna?" asked her friend Stella, a wise old star.

Luna felt sad and confused. "I don't know," she whispered. "I feel empty inside, like something important is missing."

## Chapter 2: The Journey Begins

Determined to find her light, Luna decided to travel across the sky to seek help. She met many celestial friends along the way:

- **The Moon**, who taught her about patience
- **The Comet**, who showed her the joy of movement
- **The Galaxy**, who shared wisdom about connection

But none of them could restore her light.

## Chapter 3: The Discovery

One night, Luna noticed a small planet below where children were afraid of the dark. Without thinking, she used what little light she had left to comfort them, creating a gentle glow in their bedroom windows.

Suddenly, Luna felt a warm feeling in her core. As she continued to help others – guiding lost travelers, lighting up dark paths, and bringing hope to those in need – her light began to return.

## Chapter 4: The Truth

"I understand now," Luna said to herself. "My light comes not from within, but from the love and kindness I share with others."

From that day forward, Luna shone brighter than ever before, knowing that her true purpose was to bring light and hope to all who needed it.

## The End

*Remember: We shine brightest when we help others find their way.*`,
    category: ["Fantasy"],
    language: "en",
    ageRange: "6-10",
    tags: ["stars", "kindness", "helping others", "hope"],
    status: "PUBLISHED"
  },
  {
    title: "The Brave Little Tree",
    summary: "A young tree learns about courage and resilience while protecting her forest friends from a terrible storm.",
    contentMd: `# The Brave Little Tree

In the heart of the Amazon rainforest grew a small Brazil nut tree named Esperanza. While other trees towered high above her, Esperanza was still young and small, but her heart was filled with courage.

## Chapter 1: The Warning

One morning, the wise toucan Azul flew to Esperanza with urgent news.

"A great storm is coming," Azul announced. "The biggest storm our forest has ever seen. All the animals are looking for shelter, but there's nowhere safe enough for everyone."

Esperanza looked at her modest size and felt discouraged. "I'm too small to help anyone," she sighed.

## Chapter 2: The Decision

As the storm clouds gathered, Esperanza watched families of monkeys, colorful birds, and tiny frogs searching desperately for shelter. Her heart ached seeing their fear.

"I may be small," Esperanza declared, "but I have strong roots and sturdy branches. I can try to protect someone!"

She called out to the frightened animals: "Come here! I'll do my best to keep you safe!"

## Chapter 3: The Storm

The storm was fierce. Rain poured down like waterfalls, and winds howled through the forest. Esperanza's branches bent and swayed, but she held on tight.

Under her protective canopy, she sheltered:
- A family of colorful parrots
- Three baby sloths with their mother
- A group of tiny tree frogs
- An elderly jaguar who had nowhere else to go

## Chapter 4: Finding Strength

As the storm raged on, Esperanza felt like she might break. But every time she looked at the grateful faces of the animals she was protecting, she found new strength.

"Thank you, little tree," whispered the baby sloths.
"You're our hero," chirped the parrots.

Their words of gratitude gave Esperanza the power to endure.

## Chapter 5: After the Storm

When morning came and the storm passed, Esperanza was surprised to discover something wonderful. Her roots had grown deeper and stronger from holding on so tight. Her trunk was thicker, and her branches reached further than before.

"Look!" exclaimed Azul the toucan. "You've grown during the storm!"

The wise jaguar smiled. "Courage doesn't come from being big, little one. It comes from having a big heart. And yours is the biggest in the forest."

## The End

From that day forward, Esperanza grew to become one of the mightiest trees in the Amazon, always ready to shelter those in need. She learned that true strength comes from protecting others, and courage grows when we choose to help despite our fears.

*Message: No matter how small you are, you can make a big difference when you choose to help others.*`,
    category: ["Adventure"],
    language: "en",
    ageRange: "8-12",
    tags: ["rainforest", "courage", "helping others", "Brazil", "animals"],
    status: "PUBLISHED"
  },
  {
    title: "The Magic Library Card",
    summary: "When Maya discovers a mysterious library card, she finds herself transported into the worlds of her favorite books.",
    contentMd: `# The Magic Library Card

Maya loved to read more than anything else in the world. Every day after school, she would rush to the small library in her neighborhood to discover new adventures hidden between the pages of books.

## Chapter 1: The Discovery

One rainy Tuesday, while browsing the shelves, Maya found an unusual library card tucked inside an old poetry book. The card was golden and seemed to shimmer with its own light.

"That's strange," she murmured, turning the card over in her hands. Instead of a name, it simply read: **"For the True Believer"**

## Chapter 2: The First Journey

Curious, Maya decided to check out her favorite book - "Alice's Adventures in Wonderland" - using the mysterious card. As soon as the librarian scanned it, the world around Maya began to spin.

When everything stopped spinning, Maya found herself standing in a beautiful garden with talking flowers!

"Welcome to Wonderland!" called out a cheerful daisy. "We've been expecting you!"

## Chapter 3: Many Worlds

Over the next few weeks, Maya discovered that the magic library card could transport her into any book she borrowed:

- **In "The Secret Garden"**, she helped Mary and Dickon plant new flowers
- **In "Charlotte's Web"**, she learned about friendship from Wilbur and Charlotte
- **In "The Lion, the Witch and the Wardrobe"**, she had tea with Mr. Tumnus
- **In "Where the Wild Things Are"**, she danced with Max and the monsters

Each adventure taught her something new about courage, friendship, and imagination.

## Chapter 4: The Lesson

One day, Maya met the head librarian, Ms. Chen, who had been watching her with a knowing smile.

"You have the magic library card," Ms. Chen observed.

Maya nodded, surprised. "You know about it?"

"I gave it to you," Ms. Chen revealed. "But the magic isn't really in the card, Maya. The magic is in your imagination and your love for stories. The card just helped you realize it."

## Chapter 5: Sharing the Magic

Maya understood. She began bringing her little brother Carlos to the library, reading stories aloud and helping him discover the magic of books too. She started a reading club at school and volunteered to read to younger children.

Soon, Maya realized she didn't need the magic card anymore. Her imagination had grown so strong that she could visit any world just by opening a book and believing in the story.

## The End

Maya kept the magic library card safely in her bookshelf, knowing that someday she would pass it on to another young reader who needed to discover the true magic of books - the magic that was inside them all along.

*Moral: The greatest adventures are found in books, and the real magic is in our imagination and love for reading.*`,
    category: ["Fantasy"],
    language: "en",
    ageRange: "8-12",
    tags: ["reading", "imagination", "books", "magic", "adventure"],
    status: "PUBLISHED"
  },
  {
    title: "The Solar Panel That Saved the Village",
    summary: "A young inventor creates a solar energy solution that brings electricity and hope to her remote village.",
    contentMd: `# The Solar Panel That Saved the Village

In a small village in rural Kenya, there lived a brilliant 12-year-old girl named Amara. Her village had no electricity, which meant no lights after sunset, no way to charge phones, and no refrigeration for medicine.

## Chapter 1: The Problem

Every evening, Amara would watch her younger siblings struggle to do their homework by candlelight. Her grandmother, who was the village healer, couldn't keep medicines cool, and many spoiled in the heat.

"There must be a solution," Amara thought, looking up at the bright African sun that shone powerfully every day.

At school, she had learned about solar energy - how the sun's rays could be converted into electricity. "If only we could capture some of that power," she wondered.

## Chapter 2: The Research

Amara began researching everything she could about solar panels. She walked 10 kilometers to the nearest town library every weekend, reading books about renewable energy and taking careful notes.

She learned about:
- How solar cells convert sunlight to electricity
- How batteries can store solar energy for nighttime use
- How inverters change stored energy into usable power

## Chapter 3: Building the Solution

With her older cousin James, who was studying engineering, Amara began collecting materials:

- Old car batteries from the auto repair shop
- Wire and metal sheets from the junkyard
- Glass panels from broken windows
- Electronic components from discarded radios

Working together, they built their first small solar panel system.

## Chapter 4: The First Success

Their first solar panel was small, but it worked! It generated enough electricity to power one LED light bulb for several hours.

Amara's family was amazed when she lit up their home that first evening without candles or kerosene lamps.

"It's like magic!" exclaimed her little sister Kesi.

"It's not magic," Amara smiled. "It's science!"

## Chapter 5: Growing the Project

Word spread quickly through the village about Amara's solar light. The village elders asked if she could create more panels for other families.

Amara organized the village children to help collect materials. She taught them how solar panels worked and showed them how to build simple circuits.

Soon, they had built ten solar panel systems - enough to provide basic electricity to every home in the village.

## Chapter 6: The Transformation

With solar electricity, everything changed:

- Children could study after dark and their grades improved
- The village health clinic could refrigerate vaccines and medicines
- People could charge their phones to communicate with relatives in the city
- Small businesses started operating - a barber shop, a phone charging station, and a small shop that stayed open in the evenings

## Chapter 7: Recognition

Amara's project caught the attention of engineers from the capital city. They were so impressed that they provided materials for a larger solar installation that could power the entire village, including the school and clinic.

Amara was invited to speak at conferences about renewable energy and became an inspiration for young inventors across Africa.

## The End

Today, Amara is studying renewable energy engineering at university, but she still returns to her village every holiday to teach other young people about solar power. Her village has become a model for sustainable development, all because one young girl looked at a problem and refused to accept it.

*Message: Innovation comes from seeing problems as opportunities. Young people can create solutions that change their communities and the world.*`,
    category: ["Science"],
    language: "en",
    ageRange: "10-14",
    tags: ["solar energy", "innovation", "Africa", "problem solving", "sustainability"],
    status: "PUBLISHED"
  },
  {
    title: "The Friendship Bridge",
    summary: "Two children from different cultures build a friendship that bridges their communities together.",
    contentMd: `# The Friendship Bridge

On opposite sides of a wide river lived two communities that had been separated for generations. On the east side was the village of Harmony Heights, where Maria lived with her family. On the west side was Riverside Village, home to a boy named David.

## Chapter 1: The Separation

The two villages had once been friends, but a disagreement many years ago led to the removal of the bridge that connected them. Since then, the communities rarely spoke to each other.

Maria often sat by the riverbank, watching the children on the other side play. She wondered what they were like and wished she could meet them.

Meanwhile, David did the same thing from his side of the river, curious about the girl he sometimes saw sitting alone by the water.

## Chapter 2: The First Contact

One day, Maria had an idea. She wrote a message on a piece of bark: "Hello! My name is Maria. What's your name?" She tied it to a stick and threw it across the river.

David found the message and was excited. He wrote back: "Hi Maria! I'm David. I've been watching you too. Do you want to be friends?"

## Chapter 3: Learning About Each Other

Through their messages, Maria and David learned they had a lot in common:

- Both loved to draw and paint
- Both enjoyed helping their grandparents with gardening
- Both were curious about the world beyond their villages
- Both dreamed of traveling to different countries

They also learned about their differences:
- Maria's family celebrated different holidays than David's family
- They spoke different languages at home (Maria spoke Spanish with her family, David spoke Arabic with his)
- They ate different traditional foods
- They had different customs and traditions

But instead of these differences driving them apart, they made them more curious about each other.

## Chapter 4: The Idea

"I wish we could meet in person," David wrote in one of his messages.

"Me too," Maria replied. "But the grown-ups say the river is too dangerous to cross."

That's when Maria had a brilliant idea. "What if we built a bridge?"

"But we're just kids," David wrote back. "How could we build a bridge?"

"Not a bridge for walking," Maria explained. "A friendship bridge - something that shows both villages that kids from different places can be friends."

## Chapter 5: The Friendship Bridge

Maria and David convinced their friends to help with their project. Children from both villages began working on their sides of the river.

They created a beautiful art installation:
- Colorful banners with messages of friendship in both Spanish and Arabic
- Painted rocks arranged in patterns that could be seen from both sides
- A rope stretched across the narrow part of the river with friendship bracelets tied to it
- Paper boats with wishes for peace floating back and forth

## Chapter 6: The Adults Take Notice

When the parents and grandparents saw what the children had created, they were amazed. The artwork was beautiful, and the messages of friendship touched their hearts.

"Look how creative our children are when they work together," said Maria's grandmother.

"Maybe it's time we remembered why we became separated," admitted David's grandfather. "The reason seems so small now compared to this beautiful friendship."

## Chapter 7: Rebuilding Connections

Inspired by their children, the adults from both villages began talking again. They realized that their old disagreement was not worth keeping their communities apart.

Working together, both villages raised money and built a new, stronger bridge across the river. The first people to cross the new bridge were Maria and David, hand in hand.

## The End

Today, the two villages are closer than ever. They share festivals, trade goods, and their children attend the same school built right next to the bridge. Maria and David's friendship bridge still stands as a reminder that understanding and friendship can overcome any divide.

*Message: Friendship knows no boundaries. When we focus on what we have in common rather than what divides us, we can build bridges between any communities.*`,
    category: ["Friendship"],
    language: "en",
    ageRange: "8-12",
    tags: ["friendship", "community", "diversity", "bridge building", "cooperation"],
    status: "PUBLISHED"
  }
];

async function seedTextStories() {
  console.log('Starting to seed text stories...');

  try {
    // First, create or get users for authors
    const authors = await Promise.all([
      prisma.user.upsert({
        where: { email: 'volunteer1@1001stories.org' },
        update: {},
        create: {
          email: 'volunteer1@1001stories.org',
          name: 'Maria Rodriguez',
          role: 'VOLUNTEER'
        }
      }),
      prisma.user.upsert({
        where: { email: 'volunteer2@1001stories.org' },
        update: {},
        create: {
          email: 'volunteer2@1001stories.org',
          name: 'David Kim',
          role: 'VOLUNTEER'
        }
      }),
      prisma.user.upsert({
        where: { email: 'teacher1@1001stories.org' },
        update: {},
        create: {
          email: 'teacher1@1001stories.org',
          name: 'Sarah Johnson',
          role: 'TEACHER'
        }
      })
    ]);

    // Create text submissions
    for (let i = 0; i < sampleTextStories.length; i++) {
      const story = sampleTextStories[i];
      const author = authors[i % authors.length];

      const textSubmission = await prisma.textSubmission.create({
        data: {
          ...story,
          authorId: author.id,
          authorRole: author.role,
          revisionNo: 1
        }
      });

      console.log(`Created text story: ${textSubmission.title}`);

      // If it's published, create a published book entry
      if (story.status === 'PUBLISHED') {
        const publishedBook = await prisma.book.create({
          data: {
            title: story.title,
            subtitle: null,
            summary: story.summary,
            content: story.contentMd,
            primaryTextId: textSubmission.id,
            authorName: author.name,
            language: story.language,
            ageRange: story.ageRange
          }
        });

        // The book is linked to the text submission via primaryTextId

        console.log(`Created published book: ${publishedBook.title}`);
      }
    }

    console.log('Successfully seeded text stories!');
    console.log(`Created ${sampleTextStories.length} text stories and their published versions.`);

  } catch (error) {
    console.error('Error seeding text stories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedTextStories()
    .then(() => {
      console.log('Text stories seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Text stories seeding failed:', error);
      process.exit(1);
    });
}

export default seedTextStories;