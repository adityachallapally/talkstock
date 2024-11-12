// app/api/create-user/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { user, account } = await request.json();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          image: user.image,
          googleId: account.providerAccountId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}