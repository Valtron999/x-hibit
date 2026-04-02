import { Icons } from "@/constants/icons";
import { Images } from "@/constants/images";
import { LinearGradient } from 'expo-linear-gradient';
import { Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from "react-native";

const  Details = () => {
    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} nestedScrollEnabled>
        <View style={{width:'100%', height: 500, overflow: 'hidden'}}>
            <ImageBackground source={Images.paint3} style={{
                width: '100%',
                height: '100%',
            }} />
        <LinearGradient
          colors={['#030303', 'transparent']}
          start={{ x: 0, y: 1 }}   
          end={{ x: 0, y: 0 }}   
          style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '50%',      
        }}
        />
        </View>
        <View style={{width:'100%', minHeight: 500, marginTop: -100}}>
        <View style={{  alignItems: 'center', justifyContent: 'center', paddingHorizontal: 50 }}>
            <Text style={ {color: "#fefefe", fontSize: 26}}>Tribal War</Text>
            <Text style={{color:  "#D4D2D3", textAlign:'center'}}>The Painting potray tribal war of the early africans</Text>
        </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 20 }}>
                <TouchableOpacity style={{ backgroundColor: '#4B4B4D', height: 56, width: 110, borderRadius: 8, alignItems: 'center', justifyContent: 'center'}}>
                        <Text style={{fontSize: 10, color: "#D4D2D3"}}>Artist</Text>
                        <Text style={{fontWeight: 'bold', color: '#fefefe', }}>Valtronarts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ backgroundColor: '#4B4B4D', height: 56, width: 110, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{fontSize: 10, color: "#D4D2D3"}}>Type</Text>
                        <Text style={{fontWeight: 'bold', color: '#fefefe', }}>Oil Painting</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ backgroundColor: '#4B4B4D', height: 56, width: 110, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{fontSize: 10, color: "#D4D2D3"}}>Likes</Text>
                        <Text style={{fontWeight: 'bold', color: '#fefefe', }}>1.2K</Text>
                </TouchableOpacity>
            </View>
                <View style={{ marginTop: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row'}}>
                            <TouchableOpacity >
                            <Image source={Icons.heartActive} style={{ width: 20, height: 20 }} />
                            </TouchableOpacity>
                            <Text style={{color: '#D4D2D3', marginHorizontal: 5}}>1.2k</Text>
                            <TouchableOpacity >
                            <Image source={Icons.comment} style={{ width: 20, height: 20 }} />
                            </TouchableOpacity>
                            <Text style={{color: '#D4D2D3', marginHorizontal: 5}}>1.2k</Text>

                            
                        </View>

                        {/* This is place will be use for purchase later */}
                            <TouchableOpacity >
                            <Image source={Icons.share} style={{ width: 20, height: 20 }} />
                            </TouchableOpacity>
                    </View>
            <View style={{marginTop: 20, paddingLeft: 20}}>
            <Text style={{ color: '#BDBFC1', fontSize: 16, fontWeight: 'bold' }}>
                More by the Artist
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                <TouchableOpacity><Image source={Images.paint3} style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }} /></TouchableOpacity>
                <TouchableOpacity><Image source={Images.paint2} style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }} /></TouchableOpacity>
                <TouchableOpacity><Image source={Images.paint1} style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }} /></TouchableOpacity>
                <TouchableOpacity><Image source={Images.paint4} style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }} /></TouchableOpacity>
                <TouchableOpacity><Image source={Images.paint5} style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }} /></TouchableOpacity>
            </ScrollView>
            </View>
            <View style={{marginTop: 20, paddingLeft: 20}}>
            <Text style={{ color: '#BDBFC1', fontSize: 16, fontWeight: 'bold',  }}>
                Recommendation
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                <TouchableOpacity><Image source={Images.paint3} style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }} /></TouchableOpacity>
                <TouchableOpacity><Image source={Images.paint2} style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }} /></TouchableOpacity>
                <TouchableOpacity><Image source={Images.paint1} style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }} /></TouchableOpacity>
                <TouchableOpacity><Image source={Images.paint4} style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }} /></TouchableOpacity>
                <TouchableOpacity><Image source={Images.paint5} style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }} /></TouchableOpacity>
            </ScrollView>
        </View>
        </View>


        
        </ScrollView>
    )
}

export default Details;