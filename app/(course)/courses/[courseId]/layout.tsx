import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

import { getProgress } from '@/actions/get-progress'
import { db } from '@/lib/db'

import { validateAdmin } from '@/lib/admin'
import { validateTeacher } from '@/lib/teacher'
import { CourseNavbar } from './_components/course-navbar'
import { CourseSidebar } from './_components/course-sidebar'

const CourseLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: { courseId: string }
}) => {
  const { userId } = auth()

  if (!userId) {
    return redirect('/dashboard')
  }

  const isTeacher = await validateTeacher(userId as string)
  const isAdmin = await validateAdmin(userId as string)

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      chapters: {
        where: {
          isPublished: true,
        },
        include: {
          userProgress: {
            where: {
              userId,
            },
          },
        },
        orderBy: {
          position: 'asc',
        },
      },
    },
  })

  if (!course) {
    return redirect('/dashboard')
  }

  const progressCount = await getProgress(userId, course.id)

  return (
    <div className="h-full">
      <div className="fixed inset-y-0 z-50 h-[80px] w-full md:pl-80">
        <CourseNavbar
          isTeacher={isTeacher}
          isAdmin={isAdmin}
          course={course}
          progressCount={progressCount}
        />
      </div>
      <div className="fixed inset-y-0 z-50 hidden h-full w-80 flex-col md:flex">
        <CourseSidebar course={course} progressCount={progressCount} />
      </div>
      <main className="h-full pt-[80px] md:pl-80">{children}</main>
    </div>
  )
}

export default CourseLayout
