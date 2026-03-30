import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小超过5MB限制' }, { status: 400 })
    }

    // 安全处理文件名：使用纯字母数字
    const ext = file.name.split('.').pop() || 'jpg'
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const fileName = `evidence/${safeName}`
    const { error } = await supabase.storage
      .from('evidence-images')
      .upload(fileName, file)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('evidence-images')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
