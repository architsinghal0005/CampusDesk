import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.resource.createMany({
    data: [
      {
        name: "Seminar Hall A",
        category: "Hall",
        capacity: 150,
        location: "Block A",
        description: "Large seminar hall"
      },
      {
        name: "Conference Room 1",
        category: "Meeting Room",
        capacity: 20,
        location: "Admin Block",
        description: "Meeting room"
      },
      {
        name: "Computer Lab 1",
        category: "Lab",
        capacity: 60,
        location: "CS Block",
        description: "Programming Lab"
      },
      {
        name: "Basketball Court",
        category: "Sports",
        location: "Sports Complex",
        description: "Outdoor court"
      },
      {
        name: "Auditorium",
        category: "Auditorium",
        capacity: 500,
        location: "Main Building",
        description: "College auditorium"
      }
    ]
  });

  console.log("Seed completed");
}

main()
  .finally(() => prisma.$disconnect());